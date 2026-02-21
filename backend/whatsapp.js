import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  jidNormalizedUser,
  isJidBroadcast,
  isJidGroup,
  getContentType,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";
import path from "path";
import { query, queryOne } from "./db.js";
import qrcodeTerminal from "qrcode-terminal"; // Tambahkan ini


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
      console.log(`📱 QR Code baru untuk sesi: ${sessionId}`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isConflict = statusCode === 409;
    // 401 = Logged Out
    const shouldReconnect = statusCode !== 440 && statusCode !== 401;

    console.log(`🔴 Koneksi ditutup (Sesi: ${sessionId}). Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

      console.log(`🔴 Koneksi ditutup (Sesi: ${sessionId}). Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

      await query(
        "UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?",
        [shouldReconnect ? "connecting" : "disconnected", sessionId],
      );

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

   if (connection === "open") {
        const phoneNumber = jidNormalizedUser(sock.user.id).split('@')[0];
        console.log(`✅ Sesi Terhubung: ${sessionId} (${phoneNumber})`);

        await query(
          "UPDATE wa_sessions SET status = ?, qr_code = NULL, phone_number = ?, connected_at = NOW() WHERE id = ?",
          ["connected", phoneNumber, sessionId]
        );

        io.emit(`session:connected:${sessionId}`, {
          sessionId: sessionId,
          phoneNumber: phoneNumber,
          status: 'connected'
        });
        
        console.log("✅ Berhasil mengirim sinyal sukses ke frontend!");

        setTimeout(async () => {
          await syncAllGroups(sessionId, sock);
        }, 3000);
      }
    });

  // ---- Event: creds.update ----
  sock.ev.on("creds.update", saveCreds);

  // ⭐ PERBAIKAN: Event untuk sinkronisasi history
  sock.ev.on("messaging-history.set", async ({ chats, contacts, messages, isLatest }) => {
    console.log(`[${sessionId}] 📥 Sinkronisasi Massal:`);
    console.log(`   - ${contacts?.length || 0} kontak`);
    console.log(`   - ${chats?.length || 0} chat`);
    console.log(`   - ${messages?.length || 0} pesan`);

    // Simpan kontak
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        await upsertContact(sessionId, contact);
      }
    }
    
    // Simpan chat & grup
    if (chats && chats.length > 0) {
      let groupCount = 0;
      for (const chat of chats) {
        await upsertChat(sessionId, chat);
        
        // Jika ini grup, fetch metadata lengkap
        if (chat.id && chat.id.endsWith('@g.us')) {
          groupCount++;
          try {
            const metadata = await sock.groupMetadata(chat.id);
            await syncGroupMetadata(sessionId, metadata, sock);
          } catch (err) {
            console.error(`❌ Gagal fetch metadata grup ${chat.id}:`, err.message);
          }
        }
      }
      console.log(`[${sessionId}] ✅ ${groupCount} grup berhasil disinkronkan`);
    }
    
    console.log(`[${sessionId}] ✅ Sinkronisasi selesai.`);
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

  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    console.log(`[${sessionId}] 👥 Grup ${id}: ${action} - ${participants.length} peserta`);
    try {
      const metadata = await sock.groupMetadata(id);
      await syncGroupMetadata(sessionId, metadata, sock);
    } catch (err) {
      console.error(`❌ Gagal update participant grup ${id}:`, err.message);
    }
  });

  // ---- Event: chats.upsert ----
  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      await upsertChat(sessionId, chat);
      
      // Jika grup, sync metadata
      if (chat.id && chat.id.endsWith('@g.us')) {
        try {
          const metadata = await sock.groupMetadata(chat.id);
          await syncGroupMetadata(sessionId, metadata, sock);
        } catch (err) {
          console.error(`❌ Gagal sync grup dari chats.upsert:`, err.message);
        }
      }
    }
  });

  // ---- Event: messages.upsert ----
sock.ev.on("messages.upsert", async ({ messages, type }) => {
  if (type !== "notify") return;

  for (const msg of messages) {
    if (isJidBroadcast(msg.key.remoteJid)) continue;

    const processed = await processMessage(sessionId, msg, sock);
    if (processed) {
      await saveMessage(sessionId, processed);
      await updateChat(sessionId, processed);

      // ✅ PERBAIKAN: Emit dengan format yang berbeda untuk grup vs personal
      const isGroupMsg = msg.key.remoteJid && msg.key.remoteJid.endsWith('@g.us');
      
      if (isGroupMsg) {
        // Format snake_case untuk komponen grup
        const groupMessage = {
          message_id: processed.messageId,
          chat_jid: processed.chatJid,
          from_jid: processed.fromJid,
          is_from_me: processed.isFromMe ? 1 : 0,
          message_type: processed.messageType,
          content: processed.content,
          caption: processed.caption,
          quoted_message_id: processed.quotedMessageId,
          quoted_content: processed.quotedContent,
          status: processed.status,
          timestamp: processed.timestamp,
          sender_name: processed.pushName,
          sender_pic: null,
          is_deleted: 0,
        };
        
        // Emit event khusus grup
        io.emit(`message:new:${sessionId}`, groupMessage);
        io.emit(`group:message:${sessionId}`, groupMessage);
      } else {
        // Emit biasa untuk chat personal (tetap camelCase)
        io.emit(`message:new:${sessionId}`, processed);
      }
      
      io.emit(`chat:update:${sessionId}`, { chatJid: processed.chatJid });
      
      // ⭐ Sync metadata grup
      if (isGroupMsg) {
        try {
          const metadata = await sock.groupMetadata(msg.key.remoteJid);
          await syncGroupMetadata(sessionId, metadata, sock);
        } catch (err) {
          // Ignore, grup mungkin sudah tersinkron
        }
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
        console.error(`[${sessionId}] ❌ Error sync grup ${groupId}:`, err.message);
      }
    }
    
    console.log(`[${sessionId}] ✅ Sinkronisasi ${groupIds.length} grup selesai`);
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
      profilePicUrl = await sock.profilePictureUrl(jid, 'image');
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
      [sessionId, jid, subject]
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
      [sessionId, jid, subject, description, owner, profilePicUrl, participants.length]
    );

    // 3. Hapus participant lama
    await query(
      "DELETE FROM wa_group_participants WHERE session_id = ? AND group_jid = ?",
      [sessionId, jid]
    );

    // 4. Simpan participant baru
    for (const participant of participants) {
      const participantJid = participant.id;
      const role = participant.admin || participant.isSuperAdmin 
        ? (participant.isSuperAdmin ? 'superadmin' : 'admin') 
        : 'member';

      await query(
        `INSERT INTO wa_group_participants (session_id, group_jid, participant_jid, role, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [sessionId, jid, participantJid, role]
      );

      // Simpan participant sebagai kontak
      await upsertContact(sessionId, { id: participantJid });
    }

    console.log(`[${sessionId}] ✅ Grup "${subject}" tersinkron (${participants.length} peserta)`);
  } catch (err) {
    console.error(`[${sessionId}] ❌ Error syncGroupMetadata:`, err);
  }
}

// Proses pesan
async function processMessage(sessionId, msg, sock) {
  try {
    const jid = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    const messageId = msg.key.id;
    const fromJid = isFromMe
      ? sock.user?.id
      : isJidGroup(jid)
        ? msg.key.participant
        : jid;
    const timestamp = new Date(msg.messageTimestamp * 1000);

    const contentType = getContentType(msg.message);
    let messageType = "unknown";
    let content = null;
    let caption = null;
    let mediaUrl = null;
    let mediaMimeType = null;
    let quotedMessageId = null;
    let quotedContent = null;

    const contextInfo = msg.message?.[contentType]?.contextInfo;
    if (contextInfo?.quotedMessage) {
      quotedMessageId = contextInfo.stanzaId;
      const quotedType = getContentType(contextInfo.quotedMessage);
      quotedContent =
        contextInfo.quotedMessage?.[quotedType]?.text ||
        contextInfo.quotedMessage?.[quotedType]?.caption ||
        "[Media]";
    }

    switch (contentType) {
      case "conversation":
        messageType = "text";
        content = msg.message.conversation;
        break;
      case "extendedTextMessage":
        messageType = "text";
        content = msg.message.extendedTextMessage?.text;
        break;
      case "imageMessage":
        messageType = "image";
        caption = msg.message.imageMessage?.caption;
        mediaMimeType = msg.message.imageMessage?.mimetype;
        content = caption || "[Foto]";
        break;
      case "videoMessage":
        messageType = "video";
        caption = msg.message.videoMessage?.caption;
        mediaMimeType = msg.message.videoMessage?.mimetype;
        content = caption || "[Video]";
        break;
      case "audioMessage":
        messageType = "audio";
        content = "[Pesan Suara]";
        mediaMimeType = msg.message.audioMessage?.mimetype;
        break;
      case "documentMessage":
        messageType = "document";
        content = msg.message.documentMessage?.fileName || "[Dokumen]";
        mediaMimeType = msg.message.documentMessage?.mimetype;
        break;
      case "stickerMessage":
        messageType = "sticker";
        content = "[Stiker]";
        break;
      case "locationMessage":
        messageType = "location";
        const lat = msg.message.locationMessage?.degreesLatitude;
        const lng = msg.message.locationMessage?.degreesLongitude;
        content = `📍 Lokasi: ${lat}, ${lng}`;
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
        }
        break;
      default:
        if (!contentType) return null;
        content = "[Tipe pesan tidak dikenal]";
    }

    return {
      sessionId,
      messageId,
      chatJid: jid,
      fromJid: jidNormalizedUser(fromJid || jid),
      isFromMe,
      messageType,
      content,
      caption,
      mediaUrl,
      mediaMimeType,
      quotedMessageId,
      quotedContent,
      status: isFromMe ? "sent" : "received",
      timestamp,
      rawData: JSON.stringify(msg.message),
      pushName: msg.pushName,
    };
  } catch (err) {
    console.error("Error proses pesan:", err);
    return null;
  }
}

async function saveMessage(sessionId, msg) {
  await query(
    `INSERT INTO wa_messages 
     (session_id, message_id, chat_jid, from_jid, is_from_me, message_type, 
      content, caption, quoted_message_id, quoted_content, status, timestamp, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     content = VALUES(content), status = VALUES(status)`,
    [
      sessionId,
      msg.messageId,
      msg.chatJid,
      msg.fromJid,
      msg.isFromMe ? 1 : 0,
      msg.messageType,
      msg.content,
      msg.caption,
      msg.quotedMessageId,
      msg.quotedContent,
      msg.status,
      msg.timestamp,
      msg.rawData,
    ],
  );

  if (!msg.isFromMe && msg.fromJid) {
    const phoneNumber = msg.fromJid.split('@')[0];
    const pushName = msg.pushName || phoneNumber;
    
    await query(
      `INSERT INTO wa_contacts (session_id, jid, push_name, phone_number, is_group, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
       push_name = COALESCE(VALUES(push_name), push_name),
       phone_number = COALESCE(VALUES(phone_number), phone_number),
       updated_at = NOW()`,
      [sessionId, msg.fromJid, pushName, phoneNumber]
    );
  }
}

async function updateChat(sessionId, msg) {
  const displayContent = msg.content || "[Media]";

  await query(
    `INSERT INTO wa_chats 
     (session_id, jid, last_message, last_message_time, last_message_from, last_message_type, unread_count, is_group)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     last_message = VALUES(last_message),
     last_message_time = VALUES(last_message_time),
     last_message_from = VALUES(last_message_from),
     last_message_type = VALUES(last_message_type),
     unread_count = IF(? = 0, unread_count + 1, 0)`,
    [
      sessionId,
      msg.chatJid,
      displayContent,
      msg.timestamp,
      msg.fromJid,
      msg.messageType,
      msg.isFromMe ? 0 : 1,
      msg.chatJid.endsWith('@g.us') ? 1 : 0,
      msg.isFromMe ? 1 : 0,
    ],
  );

  if (msg.pushName && !msg.isFromMe) {
    await query(
      "UPDATE wa_chats SET name = COALESCE(name, ?) WHERE session_id = ? AND jid = ? AND name IS NULL",
      [msg.pushName, sessionId, msg.chatJid],
    );
  }
}

async function upsertContact(sessionId, contact) {
  try {
    const jid = contact.id || contact.jid;
    if (!jid || jid.includes('@broadcast')) return;

    const phoneNumber = jid.split('@')[0];
    const name = contact.name || contact.verifiedName || null;
    const pushName = contact.notify || contact.pushname || null;
    const isGroup = jid.endsWith('@g.us') ? 1 : 0;

    await query(
      `INSERT INTO wa_contacts 
        (session_id, jid, name, push_name, phone_number, is_group, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
        name = COALESCE(VALUES(name), name),
        push_name = COALESCE(VALUES(push_name), push_name),
        phone_number = VALUES(phone_number),
        updated_at = NOW()`,
      [sessionId, jid, name, pushName, phoneNumber, isGroup]
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
    const isGroup = jid.endsWith('@g.us') ? 1 : 0;
    const unreadCount = chat.unreadCount || 0;

    await query(
      `INSERT INTO wa_chats 
        (session_id, jid, name, is_group, unread_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
        name = COALESCE(VALUES(name), name),
        is_group = VALUES(is_group),
        updated_at = NOW()`,
      [sessionId, jid, name, isGroup, unreadCount]
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

export async function logoutSession(sessionId) {
  const session = sessions.get(sessionId);
  
  if (session && session.sock) {
    try {
      console.log(`Logouting session: ${sessionId}...`);
      
      // Gunakan Promise.race agar jika logout macet, kita tetap lanjut
      await Promise.race([
        session.sock.logout(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 5000))
      ]).catch(e => console.log("Logout signal failed or timed out, forcing local delete."));

      // Pastikan socket benar-benar mati
      if (session.sock.ws) session.sock.ws.close();
    } catch (err) {
      console.error("Error during socket logout:", err.message);
    } finally {
      // Hapus dari memori apapun yang terjadi
      sessions.delete(sessionId);
    }
  }

  // Update Database
  try {
    await query(
      "UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?",
      ["disconnected", sessionId]
    );
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
  if (!number.startsWith("62")) number = "62" + number;

  return `${number}@s.whatsapp.net`;
}

export { sessions };