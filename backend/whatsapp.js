import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  jidNormalizedUser,
  isJidBroadcast,
  isJidGroup,
  getContentType,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import { query, queryOne } from "./db.js";

import qrcodeTerminal from "qrcode-terminal"; // Tambahkan ini
import fs from "fs";
import path from "path";

import { handleAIResponse } from "./services/aiService.js";
import { saveClosingEvent } from "./services/closingTrafficService.js";
import { saveKendala, detectKendalaFromText } from "./services/leadAnalysisService.js";
import { invalidateSessions } from "./services/cacheService.js";

const logger = pino({ level: "silent" });

// Menyimpan instance WhatsApp aktif
const sessions = new Map();

// ================================================
// Fungsi utama untuk membuat/memulai sesi WhatsApp
// ================================================
export async function createSession(sessionId, io) {
  const sessionDir = `./sessions/${sessionId}`;
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ["WhatsApp Web System", "Chrome", "120.0.0"],
    getMessage: async (key) => {
      const msg = await queryOne(
        "SELECT raw_data FROM wa_messages WHERE session_id = ? AND message_id = ? LIMIT 1",
        [sessionId, key.id],
      );
      if (msg?.raw_data) return JSON.parse(msg.raw_data);
      return { conversation: "" };
    },
  });

  sessions.set(sessionId, { sock, io, sessionId });

  // ⭐ FIX: Flag untuk mencegah labels.association remove selama initial sync
  let initialLabelSyncDone = false;

  // ---- Event: connection.update ----
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // ⭐ TAMBAHKAN BARIS INI UNTUK TERMINAL ⭐
      console.log(`\n📱 SCAN QR CODE UNTUK SESI: ${sessionId}`);
      qrcodeTerminal.generate(qr, { small: true });
      // ------------------------------------------

      const qrDataURL = await QRCode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: { dark: "#128C7E", light: "#FFFFFF" },
      });

      await query(
        "UPDATE wa_sessions SET qr_code = ?, status = ?, last_qr_at = NOW() WHERE id = ?",
        [qrDataURL, "connecting", sessionId],
      );

      io.emit(`qr:${sessionId}`, { qr: qrDataURL });
      io.emit("session:update", { id: sessionId, status: "connecting", qr_code: qrDataURL });
      console.log(`📱 QR Code baru untuk sesi: ${sessionId}`);
    }

    if (connection === "close") {
      const sessionObj = sessions.get(sessionId);
      if (sessionObj?._loggingOut) {
        return;
      }

      const statusCode = lastDisconnect?.error?.output?.statusCode;

      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isConflict = statusCode === 409;
      // 401 = Logged Out
      const shouldReconnect = statusCode !== 440 && statusCode !== 401;

      const newStatus = shouldReconnect ? "connecting" : "disconnected";

      console.log(
        `🔴 Koneksi ditutup (Sesi: ${sessionId}). Status: ${statusCode}. Reconnect: ${shouldReconnect}`,
      );

      await query(
        "UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?",
        [newStatus, sessionId],
      );

      io.emit("session:update", { id: sessionId, status: newStatus, qr_code: null });

      if (shouldReconnect) {
        setTimeout(() => createSession(sessionId, io), 5000);
      } else {
        sessions.delete(sessionId);
        if (isLoggedOut) {
          const sessionDir = `./sessions/${sessionId}`;
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true });
          }
        }
      }
    }

    // --- Di dalam sock.ev.on("connection.update", ...) ---
    if (connection === "open") {
      const phoneNumber = jidNormalizedUser(sock.user.id).split("@")[0];
      console.log(`✅ Sesi Terhubung: ${sessionId} (${phoneNumber})`);

      // Update status sesi
      await query(
        "UPDATE wa_sessions SET status = ?, qr_code = NULL, phone_number = ?, connected_at = NOW() WHERE id = ?",
        ["connected", phoneNumber, sessionId],
      );

      // Beri tahu frontend
      const connectedData = {
        id: sessionId,
        status: "connected",
        phone_number: phoneNumber,
        qr_code: null,
      };
      io.emit(`session:connected:${sessionId}`, {
        sessionId,
        phoneNumber,
        status: "connected",
      });
      io.emit("session:update", connectedData);

        // Proses sinkronisasi label
      setTimeout(async () => {
        try {
          console.log(`[${sessionId}] 📥 Memulai sinkronisasi label dari HP...`);

          const labelSource = sock.labels || sock;

          // --- LANGKAH 1: Ambil Master Label (Kamus Nama Label) ---
          if (typeof labelSource.getLabels === "function") {
            const masterLabels = await labelSource.getLabels();
            console.log(`[${sessionId}] 🏷️ ${masterLabels.length} jenis label di HP.`);

            for (const label of masterLabels) {
              await query(
                `INSERT INTO wa_labels (session_id, wa_label_id, name) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                [sessionId, label.id, label.name],
              );
            }
          }

          // --- LANGKAH 2: Ambil Hubungan Chat ke Label (dengan retry) ---
          const localChats = await query(
            "SELECT jid FROM wa_chats WHERE session_id = ?",
            [sessionId],
          );

          console.log(`[${sessionId}] 🔄 ${localChats.length} chat, mencocokkan label...`);

          if (typeof labelSource.getChatLabels === "function") {
            let syncedAny = false;
            let retries = 0;
            const MAX_RETRIES = 4;

            while (!syncedAny && retries <= MAX_RETRIES) {
              if (retries > 0) {
                console.log(`[${sessionId}] ⏳ Retry ${retries}/${MAX_RETRIES} (delay 20s)...`);
                await new Promise(r => setTimeout(r, 20000));
              }
              retries++;

              for (const chat of localChats) {
                const chatLabelIds = await labelSource
                  .getChatLabels(chat.jid)
                  .catch(() => []);

                if (chatLabelIds && chatLabelIds.length > 0) {
                  syncedAny = true;
                  for (const lId of chatLabelIds) {
                    await query(
                      "INSERT IGNORE INTO wa_chat_labels (session_id, chat_jid, wa_label_id) VALUES (?, ?, ?)",
                      [sessionId, chat.jid, lId],
                    );
                    const lbl = await queryOne("SELECT name FROM wa_labels WHERE wa_label_id = ? AND session_id = ?", [lId, sessionId]);
                    if (lbl && lbl.name && lbl.name.toLowerCase().includes('closing')) {
                      await saveClosingEvent(sessionId, chat.jid, new Date().toISOString(), 'label');
                    }
                  }
                }
              }
            }

            if (!syncedAny) {
              console.log(`[${sessionId}] ⚠️ Tidak ada label chat dari HP setelah ${MAX_RETRIES+1} percobaan.`);
            } else {
              console.log(`[${sessionId}] ✅ Label chat berhasil disinkronkan.`);
            }
          }

          initialLabelSyncDone = true;

          console.log(`[${sessionId}] ✅ Sinkronisasi label selesai.`);
          io.emit(`chats:refresh:${sessionId}`);
        } catch (err) {
          console.error(`[${sessionId}] ❌ Gagal sinkron label:`, err.message);
        }
      }, 10000);
    }
  });

  // ---- Event: creds.update ----
  sock.ev.on("creds.update", saveCreds);
  // ⭐ PERBAIKAN: Event untuk sinkronisasi history
  sock.ev.on(
    "messaging-history.set",
    async ({ chats, contacts, messages, isLatest }) => {
      console.log(`[${sessionId}] 📥 Sinkronisasi Massal dimulai...`);

      // 1. Simpan kontak (Hanya yang bukan broadcast)
      if (contacts && contacts.length > 0) {
        for (const contact of contacts) {
          if (contact.id?.includes("@broadcast")) continue; // Lewati status/broadcast
          await upsertContact(sessionId, contact);
        }
      }

      // 2. Simpan chat & grup
      if (chats && chats.length > 0) {
        let groupCount = 0;
        let chatCount = 0;

        for (const chat of chats) {
          const jid = chat.id || chat.jid;

          // ⭐ FILTER KRUSIAL: Jangan simpan jika itu status atau broadcast
          if (
            !jid ||
            jid === "status@broadcast" ||
            jid.includes("@broadcast")
          ) {
            continue;
          }

          // ⭐ FILTER TAMBAHAN: Jangan simpan nomor spesifik yang mengganggu jika namanya kosong
          // (Ini akan memblokir nomor 6282118364415 jika dia masuk sebagai data sampah)
          if (jid.startsWith("6282118364415") && !chat.name) {
            continue;
          }

          await upsertChat(sessionId, chat);
          chatCount++;

          // Jika ini grup, fetch metadata lengkap
          if (jid.endsWith("@g.us")) {
            groupCount++;
            try {
              const metadata = await sock.groupMetadata(jid);
              await syncGroupMetadata(sessionId, metadata, sock);
            } catch (err) {
              console.error(
                `❌ Gagal fetch metadata grup ${jid}:`,
                err.message,
              );
            }
          }
        }
        console.log(
          `[${sessionId}] ✅ ${chatCount} Chat & ${groupCount} Grup disinkronkan`,
        );
      }

      console.log(`[${sessionId}] ✅ Sinkronisasi selesai.`);
    },
  );

  // ---- Event: Labels Sinkronisasi (WA ke Sistem) ----

  // Listener ini menangkap label baru ATAU perubahan nama label
  sock.ev.on("labels.edit", async (labelData) => {
    // Log untuk debugging - bantu cek struktur data di terminal
    console.log(`[${sessionId}] 🏷️ Label Raw Data:`, JSON.stringify(labelData));

    try {
      // Baileys terkadang mengirim label tunggal, terkadang array
      const labels = Array.isArray(labelData) ? labelData : [labelData];

      for (const label of labels) {
        // Pastikan data id dan name ada sebelum insert ke DB
        const labelId = label.id || label.wa_label_id;
        const labelName = label.name;

        if (!labelId || !labelName) {
          console.warn(
            `[${sessionId}] ⚠️ Data label tidak lengkap, melewati...`,
          );
          continue;
        }

        await query(
          `INSERT INTO wa_labels (session_id, wa_label_id, name) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [sessionId, labelId, labelName],
        );

        console.log(
          `[${sessionId}] ✅ Label Sinkron: ${labelName} (ID: ${labelId})`,
        );

        // Kirim sinyal ke frontend agar UI terupdate otomatis
        io.emit(`label:created:${sessionId}`, {
          wa_label_id: labelId,
          name: labelName,
        });
      }
    } catch (err) {
      console.error("❌ Gagal sinkronisasi label baru ke DB:", err.message);
    }
  });
  sock.ev.on("labels.association", async (data) => {
    try {
      const associations = Array.isArray(data) ? data : [data];

      for (const assoc of associations) {
        const type = assoc.type;
        const chatJid = assoc.association?.chatId || assoc.chatId || assoc.id;
        const rawLabelId = assoc.association?.labelId || assoc.labelId;

        if (!chatJid || !rawLabelId) {
          console.log(`[${sessionId}] ⚠️ labels.association raw:`, JSON.stringify(assoc));
          continue;
        }

        // 🛠️ FIX: Pecah string jika labelId datang sebagai "3,4"
        const labelIds = String(rawLabelId).split(",");

        for (let labelId of labelIds) {
          labelId = labelId.trim();

          console.log(
            `[${sessionId}] 🏷️ Sinkronisasi DB: ${type} | JID: ${chatJid} | ID: ${labelId}`,
          );

          if (type === "remove") {
            // ⭐ FIX: Skip "remove" selama initial sync agar tidak menghapus
            // record yang sudah ada (yang punya assigned_at asli).
            if (!initialLabelSyncDone) {
              console.log(
                `[${sessionId}] ⏭️ Skip remove (initial sync): JID: ${chatJid} | ID: ${labelId}`,
              );
              continue;
            }
            await query(
              "DELETE FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND wa_label_id = ?",
              [sessionId, chatJid, labelId],
            );
          } else {
            // "add" ATAU undefined type (initial sync) → INSERT IGNORE
            await query(
              "INSERT IGNORE INTO wa_chat_labels (session_id, chat_jid, wa_label_id) VALUES (?, ?, ?)",
              [sessionId, chatJid, labelId],
            );
            const lbl = await queryOne("SELECT name FROM wa_labels WHERE wa_label_id = ? AND session_id = ?", [labelId, sessionId]);
            if (lbl && lbl.name && lbl.name.toLowerCase().includes('closing')) {
              await saveClosingEvent(sessionId, chatJid, new Date().toISOString(), 'label');
            }
          }
        }

        // Emit ke frontend (cukup satu kali per JID untuk efisiensi)
        io.emit(`chat:label:update:${sessionId}`, { chatJid, labelIds, type });
      }
    } catch (err) {
      console.error("❌ Gagal proses labels.association:", err.message);
    }
  });

  // ⭐ Event kontak
  sock.ev.on("contacts.upsert", async (contacts) => {
    for (const contact of contacts) {
      await upsertContact(sessionId, contact);
    }
  });

  sock.ev.on("contacts.update", async (updates) => {
    for (const update of updates) {
      await upsertContact(sessionId, update);
    }
  });

  // ⭐ Event presence (online/offline/last seen)
  sock.ev.on("presence.update", async ({ id, presences }) => {
    for (const [jid, presence] of Object.entries(presences)) {
      io.emit(`presence:update:${sessionId}`, {
        jid,
        chatJid: id,
        presence: presence.lastKnownPresence,
        lastSeen: presence.lastSeen || null,
      });
    }
  });

  // ⭐ PERBAIKAN: Event grup
  sock.ev.on("groups.upsert", async (groups) => {
    console.log(`[${sessionId}] 📥 ${groups.length} grup baru/update`);
    for (const group of groups) {
      try {
        const metadata = await sock.groupMetadata(group.id);
        await syncGroupMetadata(sessionId, metadata, sock);
        console.log(`[${sessionId}] ✅ Grup tersinkron: ${metadata.subject}`);
      } catch (err) {
        console.error(`❌ Gagal sync grup ${group.id}:`, err.message);
      }
    }
  });

  sock.ev.on("groups.update", async (updates) => {
    console.log(`[${sessionId}] 🔄 ${updates.length} grup diupdate`);
    for (const update of updates) {
      try {
        const metadata = await sock.groupMetadata(update.id);
        await syncGroupMetadata(sessionId, metadata, sock);
      } catch (err) {
        console.error(`❌ Gagal update grup ${update.id}:`, err.message);
      }
    }
  });

  sock.ev.on(
    "group-participants.update",
    async ({ id, participants, action }) => {
      console.log(
        `[${sessionId}] 👥 Grup ${id}: ${action} - ${participants.length} peserta`,
      );
      try {
        const metadata = await sock.groupMetadata(id);
        await syncGroupMetadata(sessionId, metadata, sock);
      } catch (err) {
        console.error(`❌ Gagal update participant grup ${id}:`, err.message);
      }
    },
  );

  // ---- Event: chats.upsert ----
  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      await upsertChat(sessionId, chat);

      // Jika grup, sync metadata
      if (chat.id && chat.id.endsWith("@g.us")) {
        try {
          const metadata = await sock.groupMetadata(chat.id);
          await syncGroupMetadata(sessionId, metadata, sock);
        } catch (err) {
          console.error(`❌ Gagal sync grup dari chats.upsert:`, err.message);
      }
    }
  }

});

  // ---- Event: messages.upsert ---- //
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (
        msg.key.remoteJid === "status@broadcast" ||
        isJidBroadcast(msg.key.remoteJid)
      ) {
        continue;
      }

      let mediaUrl = null;
      const messageType = Object.keys(msg.message || {})[0];
      const isMedia = [
        "imageMessage",
        "videoMessage",
        "documentMessage",
      ].includes(messageType);

      if (isMedia || messageType === "audioMessage") {
        console.log(`⏭️ Incoming media ditolak: ${messageType}`);
        continue;
      }

      const processed = await processMessage(sessionId, msg, sock);

      if (processed) {
        processed.mediaUrl = mediaUrl;
        processed.messageType = messageType?.replace("Message", "") || processed.messageType;

        const caption =
          msg.message?.[messageType]?.caption ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.conversation ||
          processed.content;

        processed.caption = caption;

        if (
          processed.messageType === "protocolMessage" ||
          processed.messageType === "deleted"
        ) {
          continue;
        }

        await saveMessage(sessionId, processed);
        await updateChat(sessionId, processed);

        const payload = {
          ...processed,
          message_id: processed.messageId,
          chat_jid: processed.chatJid,
          is_from_me: msg.key.fromMe ? 1 : 0,
          media_url: processed.mediaUrl,
          caption: processed.caption,
          sender_name: processed.pushName,
        };

        io.emit(`message:new:${sessionId}`, payload);

        if (!msg.key.fromMe) {
          io.emit("new_incoming_message", payload);
        }

        io.emit(`chat:update:${sessionId}`, { chatJid: processed.chatJid });

        if (msg.key.remoteJid?.endsWith("@g.us")) {
          try {
            const metadata = await sock.groupMetadata(msg.key.remoteJid);
            await syncGroupMetadata(sessionId, metadata, sock);
          } catch (err) {}
        }

        // Auto-detect kendala dari pesan admin (dinamis dari DB)
        if (msg.key.fromMe && caption) {
          const cat = await detectKendalaFromText(sessionId, processed.chatJid, caption);
          if (cat) {
            console.log(`[Kendala] Cek pesan admin ke ${processed.chatJid}: "${caption.slice(0, 80)}" → ${cat}`);
          }
        }

        // Auto-detect closing keywords untuk ALL private messages (fromMe bisa false di multi-device)
        if (caption && !msg.key.remoteJid?.endsWith("@g.us") && !msg.key.remoteJid?.endsWith("@newsletter")) {
          try {
            const lower = caption.toLowerCase().trim();
            const closingKeywords = await query(
              "SELECT keyword_text FROM closing_keywords WHERE session_id = ?",
              [sessionId]
            );
            console.log(`[ClosingKeyword] Cek pesan: "${caption.slice(0, 80)}" | keyword count: ${closingKeywords.length} | session: ${sessionId}`);
            const isClosing = closingKeywords.some(kw => {
              const kwLower = kw.keyword_text.toLowerCase().trim();
              console.log(`[ClosingKeyword]  → "${caption.slice(0, 50)}" ${lower.includes(kwLower) ? '✓' : '✗'} "${kwLower}"`);
              return lower.includes(kwLower);
            });
            if (isClosing) {
              console.log(`[ClosingKeyword] ✓ TERDETEKSI closing: "${caption.slice(0, 80)}"`);
              await saveClosingEvent(sessionId, processed.chatJid, new Date().toISOString(), 'outgoing_messages');
            } else {
              console.log(`[ClosingKeyword] ✗ TIDAK cocok: "${caption.slice(0, 80)}"`);
            }
          } catch (err) {
            console.error("[ClosingKeyword] Error detecting in messages.upsert:", err.message);
          }
        }

        // Auto-detect product assignment based on template text
        if (msg.key.fromMe && caption) {
          try {
            const products = await query(
              "SELECT id, name, template_text FROM lead_products WHERE session_id IS NULL OR session_id = ?",
              [sessionId]
            );
            const lower = caption.toLowerCase();
            const matchedProduct = products.find(p => {
              const tpl = (p.template_text || '').toLowerCase().trim();
              return tpl.length > 0 && lower.includes(tpl);
            });
            if (matchedProduct) {
              await query(
                `INSERT INTO lead_product_assignments (session_id, chat_jid, product_id)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE product_id = VALUES(product_id)`,
                [sessionId, processed.chatJid, matchedProduct.id]
              );
              console.log(`[LeadProduct] → Chat ${processed.chatJid} terdeteksi sebagai produk: ${matchedProduct.name} (dari messages.upsert)`);
            }
          } catch (err) {
            console.error("[LeadProduct] Error detecting in messages.upsert:", err.message);
          }
        }

        if (caption) {
          handleAIResponse(
            sessionId, 
            msg.key.remoteJid, 
            caption, 
            sock, 
            msg.key.fromMe,
            msg.key
          );
        }
      }
    }
  });

  // ---- Event: messages.update ----
  sock.ev.on("messages.update", async (updates) => {
    for (const { key, update } of updates) {
      if (update.status) {
        const statusMap = { 1: "sent", 2: "delivered", 3: "read", 4: "read" };
        const status = statusMap[update.status] || "sent";

        await query(
          "UPDATE wa_messages SET status = ? WHERE session_id = ? AND message_id = ?",
          [status, sessionId, key.id],
        );

        io.emit(`message:status:${sessionId}`, {
          messageId: key.id,
          status,
          chatJid: key.remoteJid,
        });
      }
    }
  });

  return sock;
}

// Jalankan ini untuk mengisi data yang NULL
async function repairMissingPhotos(sessionId, sock) {
  const missingChats = await query(
    "SELECT jid FROM wa_chats WHERE session_id = ? AND profile_pic_url IS NULL",
    [sessionId],
  );

  for (const chat of missingChats) {
    try {
      const url = await sock.profilePictureUrl(chat.jid, "image");
      if (url) {
        await query(
          "UPDATE wa_chats SET profile_pic_url = ? WHERE session_id = ? AND jid = ?",
          [url, sessionId, chat.jid],
        );
        console.log(`✅ Foto ditemukan untuk: ${chat.jid}`);
      }
    } catch (e) {
      console.log(
        `❌ Tidak bisa ambil foto ${chat.jid}: Mungkin privacy atau tidak ada foto.`,
      );
    }
  }
}

// ⭐ FUNGSI BARU: Sinkronisasi semua grup
async function syncAllGroups(sessionId, sock) {
  try {
    console.log(`[${sessionId}] 🔄 Mulai sinkronisasi semua grup...`);

    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);

    console.log(`[${sessionId}] 📱 Ditemukan ${groupIds.length} grup`);

    for (const groupId of groupIds) {
      try {
        const metadata = groups[groupId];
        await syncGroupMetadata(sessionId, metadata, sock);
        console.log(`[${sessionId}] ✅ Sync grup: ${metadata.subject}`);
      } catch (err) {
        console.error(
          `[${sessionId}] ❌ Error sync grup ${groupId}:`,
          err.message,
        );
      }
    }

    console.log(
      `[${sessionId}] ✅ Sinkronisasi ${groupIds.length} grup selesai`,
    );
  } catch (err) {
    console.error(`[${sessionId}] ❌ Error syncAllGroups:`, err);
  }
}

// ⭐ PERBAIKAN: Sinkronisasi metadata grup lengkap
async function syncGroupMetadata(sessionId, metadata, sock) {
  try {
    const jid = metadata.id;
    const subject = metadata.subject || "Grup Tanpa Nama";
    const description = metadata.desc || null;
    const owner = metadata.owner || null;
    const participants = metadata.participants || [];

    let profilePicUrl = null;
    try {
      profilePicUrl = await sock.profilePictureUrl(jid, "image");
    } catch (err) {
      // Grup mungkin tidak punya foto profil
    }

    // 1. Simpan ke wa_chats
    await query(
      `INSERT INTO wa_chats (session_id, jid, name, is_group, created_at, updated_at) 
       VALUES (?, ?, ?, 1, NOW(), NOW()) 
       ON DUPLICATE KEY UPDATE 
       name = VALUES(name),
       is_group = 1,
       updated_at = NOW()`,
      [sessionId, jid, subject],
    );

    // 2. Simpan ke wa_groups
    await query(
      `INSERT INTO wa_groups (session_id, jid, subject, description, owner_jid, profile_pic_url, participant_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
       subject = VALUES(subject),
       description = VALUES(description),
       owner_jid = VALUES(owner_jid),
       profile_pic_url = VALUES(profile_pic_url),
       participant_count = VALUES(participant_count),
       updated_at = NOW()`,
      [
        sessionId,
        jid,
        subject,
        description,
        owner,
        profilePicUrl,
        participants.length,
      ],
    );

    // 3. Hapus participant lama
    await query(
      "DELETE FROM wa_group_participants WHERE session_id = ? AND group_jid = ?",
      [sessionId, jid],
    );

    // 4. Simpan participant baru
    for (const participant of participants) {
      const participantJid = participant.id;
      const role =
        participant.admin || participant.isSuperAdmin
          ? participant.isSuperAdmin
            ? "superadmin"
            : "admin"
          : "member";

      await query(
        `INSERT IGNORE INTO wa_group_participants (session_id, group_jid, participant_jid, role, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [sessionId, jid, participantJid, role],
      );

      // Simpan participant sebagai kontak
      await upsertContact(sessionId, { id: participantJid });
    }

    console.log(
      `[${sessionId}] ✅ Grup "${subject}" tersinkron (${participants.length} peserta)`,
    );
  } catch (err) {
    console.error(`[${sessionId}] ❌ Error syncGroupMetadata:`, err);
  }
}

async function processMessage(sessionId, msg, sock) {
  try {
    const jid = jidNormalizedUser(msg.key.remoteJid);
    const isFromMe = msg.key.fromMe;
    const messageId = msg.key.id;
    const fromJid = isFromMe
      ? sock.user?.id
      : isJidGroup(jid)
        ? msg.key.participant
        : jid;
    const timestamp = new Date(msg.messageTimestamp * 1000);

    const contentType = getContentType(msg.message);

    if (!contentType || contentType === "senderKeyDistributionMessage" || contentType === "imageMessage" || contentType === "videoMessage")
      return null;

    let messageType = "unknown"; // Default ke unknown jika tidak terdaftar di ENUM
    let content = "";
    let caption = null;
    let quotedMessageId = null;
    let quotedContent = null;

    // 1. PROSES QUOTED MESSAGE
    const contextInfo = msg.message?.[contentType]?.contextInfo;
    if (contextInfo?.quotedMessage) {
      quotedMessageId = contextInfo.stanzaId;
      const quotedType = getContentType(contextInfo.quotedMessage);
      const q = contextInfo.quotedMessage[quotedType];
      quotedContent =
        typeof q === "string"
          ? q
          : q?.text || q?.caption || q?.conversation || "[Media]";
    }

    // 2. MAPPING KONTEN - WAJIB SESUAI ENUM DATABASE
    switch (contentType) {
      case "conversation":
      case "extendedTextMessage":
        messageType = "text"; // Kita paksa ke 'text' agar diterima ENUM
        content =
          msg.message.conversation || msg.message.extendedTextMessage?.text;
        break;
      case "imageMessage":
        messageType = "image";
        caption = msg.message.imageMessage?.caption;
        content = caption || "[Foto]";
        break;
      case "videoMessage":
        messageType = "video";
        caption = msg.message.videoMessage?.caption;
        content = caption || "[Video]";
        break;
      case "audioMessage":
        messageType = "audio";
        content = "[Pesan Suara]";
        break;
      case "documentMessage":
        messageType = "document";
        content = msg.message.documentMessage?.fileName || "[Dokumen]";
        break;
      case "stickerMessage":
        messageType = "sticker";
        content = "[Stiker]";
        break;
      case "locationMessage":
        messageType = "location";
        content = "[Lokasi]";
        break;
      case "contactMessage":
      case "contactsArrayMessage":
        messageType = "contact";
        content = "[Kontak]";
        break;
      case "reactionMessage":
        messageType = "reaction";
        content = msg.message.reactionMessage?.text;
        break;
      case "protocolMessage":
        if (msg.message.protocolMessage?.type === 0) {
          messageType = "deleted";
          content = "[Pesan dihapus]";
        } else {
          return null;
        }
        break;
      default:
        messageType = "unknown"; // Pastikan masuk ke 'unknown' jika tipe aneh muncul
        content = "[Pesan]";
    }

    // 3. PEMBERSIHAN FINAL
    if (typeof content === "object" && content !== null) {
      content = content.text || content.conversation || "";
    }
    content = String(content || "").trim();

    return {
      sessionId,
      messageId,
      chatJid: jid,
      fromJid: jidNormalizedUser(fromJid || jid),
      isFromMe,
      messageType, // Nilai ini sekarang DIJAMIN ada di list ENUM database
      content: content,
      caption,
      mediaUrl: null,
      mediaMimeType: msg.message?.[contentType]?.mimetype || null,
      quotedMessageId,
      quotedContent,
      status: isFromMe ? "sent" : "received",
      timestamp,
      rawData: JSON.stringify(msg.message),
      pushName: msg.pushName || null,
    };
  } catch (err) {
    console.error("❌ Error proses pesan:", err);
    return null;
  }
}

async function saveMessage(sessionId, msg) {
  await query(
    `INSERT INTO wa_messages 
      (session_id, message_id, chat_jid, from_jid, is_from_me, message_type, 
       content, caption, media_url, quoted_message_id, quoted_content, status, timestamp, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
       content = VALUES(content), 
       status = VALUES(status),
       media_url = VALUES(media_url)`, // Tambahkan agar media_url terupdate jika ada
    [
      sessionId,
      msg.messageId,
      msg.chatJid,
      msg.fromJid,
      msg.isFromMe ? 1 : 0,
      msg.messageType,
      msg.content,
      msg.caption,
      msg.mediaUrl, // <--- TAMBAHKAN INI (Urutan ke-9)
      msg.quotedMessageId,
      msg.quotedContent,
      msg.status,
      msg.timestamp,
      msg.rawData,
    ],
  );

  if (!msg.isFromMe && msg.fromJid) {
    const phoneNumber = msg.fromJid.split("@")[0];
    const pushName = msg.pushName || phoneNumber;

    await query(
      `INSERT INTO wa_contacts (session_id, jid, push_name, phone_number, is_group, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
       push_name = COALESCE(VALUES(push_name), push_name),
       phone_number = COALESCE(VALUES(phone_number), phone_number),
       updated_at = NOW()`,
      [sessionId, msg.fromJid, pushName, phoneNumber],
    );
  }
}

async function updateChat(sessionId, msg) {
  const jid = msg.chatJid;

  // ⭐ 1. FILTER KEAMANAN: Jangan proses jika ini adalah status atau broadcast
  if (!jid || jid === "status@broadcast" || jid.includes("@broadcast")) {
    return;
  }

  // ⭐ 2. FILTER TAMBAHAN: Abaikan nomor pengganggu spesifik jika isinya cuma [Media]
  if (jid.startsWith("6282118364415") && msg.content === "[Media]") {
    console.log(`🚫 Mengabaikan aktivitas status dari ${jid}`);
    return;
  }

  const displayContent = msg.content || "[Media]";
  const session = sessions.get(sessionId);

  // --- LOGIKA AMBIL FOTO PROFIL ---
  let profilePicUrl = null;
  if (session && session.sock) {
    try {
      // Hanya ambil foto jika di database masih NULL untuk menghemat kuota request
      const existingChat = await queryOne(
        "SELECT profile_pic_url FROM wa_chats WHERE session_id = ? AND jid = ?",
        [sessionId, jid],
      );

      if (!existingChat?.profile_pic_url) {
        profilePicUrl = await session.sock.profilePictureUrl(jid, "image");
      } else {
        profilePicUrl = existingChat.profile_pic_url;
      }
    } catch (err) {
      profilePicUrl = null;
    }
  }

  // --- SIMPAN KE DATABASE ---
  await query(
    `INSERT INTO wa_chats 
      (session_id, jid, last_message, last_message_time, last_message_from, last_message_type, unread_count, is_group, profile_pic_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      last_message = VALUES(last_message),
      last_message_time = VALUES(last_message_time),
      last_message_from = VALUES(last_message_from),
      last_message_type = VALUES(last_message_type),
      unread_count = IF(? = 0, unread_count + 1, 0),
      profile_pic_url = COALESCE(VALUES(profile_pic_url), profile_pic_url),
      updated_at = NOW()`,
    [
      sessionId,
      jid,
      displayContent,
      msg.timestamp,
      msg.fromJid,
      msg.messageType,
      msg.isFromMe ? 0 : 1,
      jid.endsWith("@g.us") ? 1 : 0,
      profilePicUrl,
      msg.isFromMe ? 1 : 0,
    ],
  );

  // --- UPDATE NAMA JIKA ADA ---
  if (msg.pushName && !msg.isFromMe) {
    await query(
      "UPDATE wa_chats SET name = COALESCE(name, ?) WHERE session_id = ? AND jid = ? AND name IS NULL",
      [msg.pushName, sessionId, jid],
    );
  }

  // --- KIRIM SIGNAL REALTIME KE FRONTEND ---
  if (session && session.io) {
    session.io.emit(`chat:update:${sessionId}`, {
      chatJid: jid,
      name: msg.pushName || null,
      lastMessage: displayContent,
      lastMessageTime: msg.timestamp,
      profilePicUrl: profilePicUrl,
    });
  }
}

async function upsertContact(sessionId, contact) {
  try {
    const jid = contact.id || contact.jid;
    if (!jid || jid.includes("@broadcast")) return;

    const phoneNumber = jid.split("@")[0];
    const name = contact.name || contact.verifiedName || null;
    const pushName = contact.notify || contact.pushname || null;
    const isGroup = jid.endsWith("@g.us") ? 1 : 0;

    await query(
      `INSERT INTO wa_contacts 
        (session_id, jid, name, push_name, phone_number, is_group, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
        name = COALESCE(VALUES(name), name),
        push_name = COALESCE(VALUES(push_name), push_name),
        phone_number = VALUES(phone_number),
        updated_at = NOW()`,
      [sessionId, jid, name, pushName, phoneNumber, isGroup],
    );
  } catch (err) {
    console.error("❌ Gagal simpan kontak:", err.message);
  }
}

async function upsertChat(sessionId, chat) {
  try {
    const jid = chat.id || chat.jid;
    if (!jid) return;

    const name = chat.name || chat.subject || null;
    const isGroup = jid.endsWith("@g.us") ? 1 : 0;
    const unreadCount = chat.unreadCount || 0;

    await query(
      `INSERT INTO wa_chats 
        (session_id, jid, name, is_group, unread_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
        name = COALESCE(VALUES(name), name),
        is_group = VALUES(is_group),
        updated_at = NOW()`,
      [sessionId, jid, name, isGroup, unreadCount],
    );
  } catch (err) {
    console.error("❌ Gagal simpan chat:", err.message);
  }
}

export async function sendTextMessage(sessionId, to, text, quotedMsgId = null) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Sesi tidak ditemukan atau tidak aktif");

  const { sock } = session;
  const jid = formatJid(to);

  let messageOptions = { text };

  if (quotedMsgId) {
    const quotedMsg = await queryOne(
      "SELECT raw_data, from_jid, chat_jid FROM wa_messages WHERE session_id = ? AND message_id = ?",
      [sessionId, quotedMsgId],
    );
    if (quotedMsg?.raw_data) {
      messageOptions = {
        text,
        contextInfo: {
          stanzaId: quotedMsgId,
          participant: quotedMsg.from_jid,
          quotedMessage: JSON.parse(quotedMsg.raw_data),
        },
      };
    }
  }

  const sent = await sock.sendMessage(jid, messageOptions);
  const processed = await processMessage(sessionId, sent, sock);

  if (processed) {
    await saveMessage(sessionId, processed);
    await updateChat(sessionId, processed);

    const io = session.io;
    io.emit(`message:new:${sessionId}`, processed);
    io.emit(`chat:update:${sessionId}`, { chatJid: processed.chatJid });

    // Auto-detect closing: dynamic keywords per session
    const lower = (text || '').toLowerCase();
    console.log(`[Kendala] Cek pesan dari panel ke ${jid}: "${(text || '').slice(0, 80)}"`);
    try {
      const closingKeywords = await query(
        "SELECT keyword_text FROM closing_keywords WHERE session_id = ?",
        [sessionId]
      );
      const isClosing = closingKeywords.some(kw => {
        return lower.trim().includes(kw.keyword_text.toLowerCase().trim());
      });
      if (isClosing) {
        console.log(`[ClosingKeyword] ✓ TERDETEKSI closing dari panel: "${text.slice(0, 80)}"`);
        await saveClosingEvent(sessionId, jid, new Date().toISOString(), 'outgoing_template');
      }
    } catch (err) {
      console.error("[ClosingKeyword] Error detecting:", err.message);
    }

    // Auto-detect lead kendala (dinamis dari DB)
    try {
      await detectKendalaFromText(sessionId, jid, text || '');
    } catch (err) {
      console.error("[Kendala] Error detecting in sendTextMessage:", err.message);
    }

    // Auto-detect product assignment based on template text
    try {
      const products = await query(
        "SELECT id, name, template_text, session_id FROM lead_products WHERE session_id IS NULL OR session_id = ?",
        [sessionId]
      );
      console.log(`[LeadProduct] Checking text: "${text}" lower: "${lower}" products: ${products.length} (session: ${sessionId})`);
      const matchedProduct = products.find(p => {
        const tpl = (p.template_text || '').toLowerCase().trim();
        const match = tpl.length > 0 && lower.includes(tpl);
        console.log(`[LeadProduct]  → "${p.name}": template="${tpl}" match=${match}`);
        return match;
      });
      if (matchedProduct) {
        await query(
          `INSERT INTO lead_product_assignments (session_id, chat_jid, product_id)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE product_id = VALUES(product_id)`,
          [sessionId, jid, matchedProduct.id]
        );
        console.log(`[LeadProduct] → Chat ${jid} terdeteksi sebagai produk: ${matchedProduct.name}`);
      } else {
        console.log(`[LeadProduct] → Tidak ada produk yang cocok dengan "${lower}"`);
      }
    } catch (err) {
      console.error("[LeadProduct] Error detecting:", err.message, err.stack);
    }

    // Auto-detect lead kendala: usia / biaya (static fallback)
    if (lower.includes('usia')) {
      console.log(`[Kendala] → TERDETEKSI: usia`);
      await saveKendala(sessionId, jid, 'usia', 'Admin membalas terkait usia');
    }
    if (lower.includes('biaya') || lower.includes('bisa persiapkan terlebih dahulu')) {
      console.log(`[Kendala] → TERDETEKSI: biaya`);
      await saveKendala(sessionId, jid, 'biaya', 'Admin membalas terkait biaya');
    }
    // Auto-detect: bertato
    if (lower.includes('tidak diperbolehkan bertato') || lower.includes('ketentuan tidak diperbolehkan bertato')) {
      console.log(`[Kendala] → TERDETEKSI: bertato`);
      await saveKendala(sessionId, jid, 'bertato', 'Admin membalas kendala tato');
    }
    // Auto-detect: tidak memenuhi syarat
    if (lower.includes('belum memenuhi persyaratannya') || lower.includes('belum memenuhi syarat')) {
      console.log(`[Kendala] → TERDETEKSI: tidak_memenuhi_syarat`);
      await saveKendala(sessionId, jid, 'tidak_memenuhi_syarat', 'Admin membalas belum memenuhi syarat');
    }
    // Auto-detect: belum ada data
    if (lower.includes('boleh di bantu untuk di isi terlebih dahulu') || lower.includes('bantu di isi terlebih dahulu')) {
      console.log(`[Kendala] → TERDETEKSI: belum_ada_data`);
      await saveKendala(sessionId, jid, 'belum_ada_data', 'Admin meminta isi data terlebih dahulu');
    }
    // Auto-detect: tidak ada respon
    if (lower.includes('izin follow up ya') || lower.includes('izin follow up')) {
      console.log(`[Kendala] → TERDETEKSI: tidak_ada_respon`);
      await saveKendala(sessionId, jid, 'tidak_ada_respon', 'Admin follow up karena tidak ada respon');
    }
    // Auto-detect: matching job
    if (lower.includes('syarat untuk bisa matching job') || lower.includes('mengikuti salah satu kelas mendunia')) {
      console.log(`[Kendala] → TERDETEKSI: matching_job`);
      await saveKendala(sessionId, jid, 'matching_job', 'Admin membalas syarat matching job');
    }
  }

  return sent;
}

export async function sendMediaMessage(
  sessionId,
  to,
  mediaBuffer,
  mimeType,
  caption = "",
  filename = "",
) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Sesi tidak ditemukan");

  const { sock } = session;
  const jid = formatJid(to);

  let msgContent = {};
  if (mimeType.startsWith("image/")) {
    msgContent = { image: mediaBuffer, caption };
  } else if (mimeType.startsWith("video/")) {
    msgContent = { video: mediaBuffer, caption };
  } else if (mimeType.startsWith("audio/")) {
    msgContent = {
      audio: mediaBuffer,
      mimetype: mimeType,
      ptt: mimeType.includes("ogg"),
    };
  } else {
    msgContent = {
      document: mediaBuffer,
      mimetype: mimeType,
      fileName: filename,
    };
  }

  const sent = await sock.sendMessage(jid, msgContent);
  return sent;
}

export async function markAsRead(sessionId, chatJid) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const { sock } = session;
  const jid = formatJid(chatJid);

  const unreadMessages = await query(
    `SELECT message_id, from_jid FROM wa_messages 
     WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0 AND status != 'read'
     ORDER BY timestamp DESC LIMIT 20`,
    [sessionId, chatJid],
  );

  if (unreadMessages.length > 0) {
    const keys = unreadMessages.map((m) => ({
      remoteJid: jid,
      id: m.message_id,
      participant: isJidGroup(jid) ? m.from_jid : undefined,
    }));

    await sock.readMessages(keys);
  }

  await query(
    "UPDATE wa_chats SET unread_count = 0 WHERE session_id = ? AND jid = ?",
    [sessionId, chatJid],
  );

  await query(
    "UPDATE wa_messages SET status = 'read' WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0",
    [sessionId, chatJid],
  );
}

export async function deleteMessage(
  sessionId,
  chatJid,
  messageId,
  forEveryone = false,
) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Sesi tidak ditemukan");

  const { sock } = session;
  const jid = formatJid(chatJid);

  if (forEveryone) {
    await sock.sendMessage(jid, {
      delete: { remoteJid: jid, id: messageId, fromMe: true },
    });
  }

  await query(
    'UPDATE wa_messages SET is_deleted = 1, content = "[Pesan dihapus]" WHERE session_id = ? AND message_id = ?',
    [sessionId, messageId],
  );
}

export async function logoutSession(sessionId, io = null) {
  const session = sessions.get(sessionId);

  if (session && session.sock) {
    try {
      console.log(`Logouting session: ${sessionId}...`);
      session._loggingOut = true;

      // Redam noise console.log dari Baileys internal saat logout
      const origLog = console.log;
      console.log = (...a) => {
        if (typeof a[0] === 'string' && a[0].startsWith('Closing session')) return;
        origLog.apply(console, a);
      };

      await Promise.race([
        session.sock.logout(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Logout timeout")), 5000),
        ),
      ]).catch((e) =>
        console.log("Logout signal failed or timed out, forcing local delete."),
      );

      if (session.sock.ws) session.sock.ws.close();
    } catch (err) {
      console.error("Error during socket logout:", err.message);
    } finally {
      console.log = origLog;
      sessions.delete(sessionId);
    }
  }

  // Update Database
  try {
    await query(
      "UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?",
      ["disconnected", sessionId],
    );

    if (io) {
      io.emit("session:update", { id: sessionId, status: "disconnected", qr_code: null });
    }

    await invalidateSessions();

    console.log(`Database updated for session: ${sessionId}`);
  } catch (dbErr) {
    console.error("Database update failed:", dbErr);
  }

  // Hapus Folder Sesi (PENTING: Gunakan { force: true } agar tidak error jika folder tidak ada)
  const sessionDir = `./sessions/${sessionId}`;
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`Folder session ${sessionId} deleted.`);
    } catch (fsErr) {
      console.error("Failed to delete session folder:", fsErr);
    }
  }
}

export async function getSessionInfo(sessionId) {
  return await queryOne("SELECT * FROM wa_sessions WHERE id = ?", [sessionId]);
}

export function isSessionConnected(sessionId) {
  const session = sessions.get(sessionId);
  return session?.sock?.user != null;
}

function formatJid(phone) {
  if (phone.includes("@")) return phone;

  let number = phone.replace(/[^0-9]/g, "");
  if (number.startsWith("0")) number = "62" + number.substring(1);

  return `${number}@s.whatsapp.net`;
}

export { sessions };
