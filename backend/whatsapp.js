// whatsapp.js - WhatsApp Service menggunakan Baileys
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  jidNormalizedUser,
  isJidBroadcast,
  isJidGroup,
  getContentType,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { query, queryOne } from './db.js';

const logger = pino({ level: 'silent' });

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
    browser: ['WhatsApp Web System', 'Chrome', '120.0.0'],
    getMessage: async (key) => {
      const msg = await queryOne(
        'SELECT raw_data FROM wa_messages WHERE session_id = ? AND message_id = ? LIMIT 1',
        [sessionId, key.id]
      );
      if (msg?.raw_data) return JSON.parse(msg.raw_data);
      return { conversation: '' };
    },
  });

  sessions.set(sessionId, { sock, io, sessionId });

  // ---- Event: connection.update ----
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Generate QR Code sebagai data URL (base64 PNG)
      const qrDataURL = await QRCode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: { dark: '#128C7E', light: '#FFFFFF' },
      });

      // Simpan QR ke database
      await query(
        'UPDATE wa_sessions SET qr_code = ?, status = ?, last_qr_at = NOW() WHERE id = ?',
        [qrDataURL, 'connecting', sessionId]
      );

      // Kirim QR ke frontend via Socket.IO
      io.emit(`qr:${sessionId}`, { qr: qrDataURL });
      io.emit('session:update', await getSessionInfo(sessionId));
      console.log(`📱 QR Code baru untuk sesi: ${sessionId}`);
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log(`🔴 Koneksi ditutup untuk sesi ${sessionId}. Reconnect: ${shouldReconnect}`);

      await query(
        'UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?',
        [shouldReconnect ? 'connecting' : 'disconnected', sessionId]
      );

      io.emit('session:update', await getSessionInfo(sessionId));

      if (shouldReconnect) {
        setTimeout(() => createSession(sessionId, io), 3000);
      } else {
        // Logout: hapus file sesi
        sessions.delete(sessionId);
        const sessionDir = `./sessions/${sessionId}`;
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true });
        }
      }
    }

    if (connection === 'open') {
      const userJid = sock.user?.id;
      const phoneNumber = userJid?.split(':')[0]?.split('@')[0];
      console.log(`✅ Terhubung ke WhatsApp! Nomor: ${phoneNumber}`);

      await query(
        'UPDATE wa_sessions SET status = ?, phone_number = ?, qr_code = NULL, connected_at = NOW() WHERE id = ?',
        ['connected', phoneNumber, sessionId]
      );

      io.emit(`session:connected:${sessionId}`, { phoneNumber });
      io.emit('session:update', await getSessionInfo(sessionId));
    }
  });

  // ---- Event: creds.update ----
  sock.ev.on('creds.update', saveCreds);

  // ---- Event: messages.upsert ----
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (isJidBroadcast(msg.key.remoteJid)) continue;

      const processed = await processMessage(sessionId, msg, sock);
      if (processed) {
        // Simpan ke database
        await saveMessage(sessionId, processed);

        // Update chat
        await updateChat(sessionId, processed);

        // Kirim ke frontend via Socket.IO
        io.emit(`message:new:${sessionId}`, processed);
        io.emit(`chat:update:${sessionId}`, { chatJid: processed.chatJid });
        console.log(`📨 Pesan baru dari ${processed.fromJid}: ${processed.content?.substring(0, 50)}`);
      }
    }
  });

  // ---- Event: messages.update (status update) ----
  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (update.status) {
        const statusMap = { 1: 'sent', 2: 'delivered', 3: 'read', 4: 'read' };
        const status = statusMap[update.status] || 'sent';

        await query(
          'UPDATE wa_messages SET status = ? WHERE session_id = ? AND message_id = ?',
          [status, sessionId, key.id]
        );

        io.emit(`message:status:${sessionId}`, {
          messageId: key.id,
          status,
          chatJid: key.remoteJid,
        });
      }
    }
  });

  // ---- Event: contacts.upsert ----
  sock.ev.on('contacts.upsert', async (contacts) => {
    for (const contact of contacts) {
      await upsertContact(sessionId, contact);
    }
  });

  // ---- Event: chats.upsert ----
  sock.ev.on('chats.upsert', async (chats) => {
    for (const chat of chats) {
      await upsertChat(sessionId, chat);
    }
  });

  return sock;
}

// ================================================
// Memproses pesan masuk menjadi format standar
// ================================================
async function processMessage(sessionId, msg, sock) {
  try {
    const jid = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    const messageId = msg.key.id;
    const fromJid = isFromMe
      ? sock.user?.id
      : (isJidGroup(jid) ? msg.key.participant : jid);
    const timestamp = new Date(msg.messageTimestamp * 1000);

    const contentType = getContentType(msg.message);
    let messageType = 'unknown';
    let content = null;
    let caption = null;
    let mediaUrl = null;
    let mediaMimeType = null;
    let quotedMessageId = null;
    let quotedContent = null;

    // Ambil quoted message jika ada
    const contextInfo = msg.message?.[contentType]?.contextInfo;
    if (contextInfo?.quotedMessage) {
      quotedMessageId = contextInfo.stanzaId;
      const quotedType = getContentType(contextInfo.quotedMessage);
      quotedContent = contextInfo.quotedMessage?.[quotedType]?.text ||
        contextInfo.quotedMessage?.[quotedType]?.caption || '[Media]';
    }

    // Parse berdasarkan tipe konten
    switch (contentType) {
      case 'conversation':
        messageType = 'text';
        content = msg.message.conversation;
        break;

      case 'extendedTextMessage':
        messageType = 'text';
        content = msg.message.extendedTextMessage?.text;
        break;

      case 'imageMessage':
        messageType = 'image';
        caption = msg.message.imageMessage?.caption;
        mediaMimeType = msg.message.imageMessage?.mimetype;
        content = caption || '[Foto]';
        break;

      case 'videoMessage':
        messageType = 'video';
        caption = msg.message.videoMessage?.caption;
        mediaMimeType = msg.message.videoMessage?.mimetype;
        content = caption || '[Video]';
        break;

      case 'audioMessage':
        messageType = 'audio';
        content = '[Pesan Suara]';
        mediaMimeType = msg.message.audioMessage?.mimetype;
        break;

      case 'documentMessage':
        messageType = 'document';
        content = msg.message.documentMessage?.fileName || '[Dokumen]';
        mediaMimeType = msg.message.documentMessage?.mimetype;
        break;

      case 'stickerMessage':
        messageType = 'sticker';
        content = '[Stiker]';
        break;

      case 'locationMessage':
        messageType = 'location';
        const lat = msg.message.locationMessage?.degreesLatitude;
        const lng = msg.message.locationMessage?.degreesLongitude;
        content = `📍 Lokasi: ${lat}, ${lng}`;
        break;

      case 'contactMessage':
      case 'contactsArrayMessage':
        messageType = 'contact';
        content = '[Kontak]';
        break;

      case 'reactionMessage':
        messageType = 'reaction';
        content = msg.message.reactionMessage?.text;
        break;

      case 'protocolMessage':
        if (msg.message.protocolMessage?.type === 0) {
          messageType = 'deleted';
          content = '[Pesan dihapus]';
        }
        break;

      default:
        if (!contentType) return null;
        content = '[Tipe pesan tidak dikenal]';
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
      status: isFromMe ? 'sent' : 'received',
      timestamp,
      rawData: JSON.stringify(msg.message),
      pushName: msg.pushName,
    };
  } catch (err) {
    console.error('Error proses pesan:', err);
    return null;
  }
}

// ================================================
// Simpan pesan ke database MySQL
// ================================================
async function saveMessage(sessionId, msg) {
  await query(
    `INSERT INTO wa_messages 
     (session_id, message_id, chat_jid, from_jid, is_from_me, message_type, 
      content, caption, quoted_message_id, quoted_content, status, timestamp, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     content = VALUES(content), status = VALUES(status)`,
    [
      sessionId, msg.messageId, msg.chatJid, msg.fromJid,
      msg.isFromMe ? 1 : 0, msg.messageType, msg.content,
      msg.caption, msg.quotedMessageId, msg.quotedContent,
      msg.status, msg.timestamp, msg.rawData,
    ]
  );
}

// ================================================
// Update data chat setelah pesan masuk
// ================================================
async function updateChat(sessionId, msg) {
  const displayContent = msg.content || '[Media]';

  await query(
    `INSERT INTO wa_chats 
     (session_id, jid, last_message, last_message_time, last_message_from, unread_count)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     last_message = VALUES(last_message),
     last_message_time = VALUES(last_message_time),
     last_message_from = VALUES(last_message_from),
     unread_count = IF(? = 0, unread_count + 1, 0)`,
    [
      sessionId, msg.chatJid, displayContent,
      msg.timestamp, msg.fromJid,
      msg.isFromMe ? 0 : 1,
      msg.isFromMe ? 1 : 0,
    ]
  );

  // Update nama chat dari pushName jika belum ada
  if (msg.pushName && !msg.isFromMe) {
    await query(
      'UPDATE wa_chats SET name = COALESCE(name, ?) WHERE session_id = ? AND jid = ? AND name IS NULL',
      [msg.pushName, sessionId, msg.chatJid]
    );
  }
}

// ================================================
// Upsert kontak
// ================================================
async function upsertContact(sessionId, contact) {
  const phoneNumber = contact.id?.split('@')[0];
  await query(
    `INSERT INTO wa_contacts (session_id, jid, name, push_name, phone_number, is_business, is_group)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     name = COALESCE(VALUES(name), name),
     push_name = COALESCE(VALUES(push_name), push_name)`,
    [
      sessionId, contact.id,
      contact.name || null,
      contact.notify || null,
      phoneNumber,
      contact.isBusiness ? 1 : 0,
      isJidGroup(contact.id) ? 1 : 0,
    ]
  );
}

// ================================================
// Upsert chat
// ================================================
async function upsertChat(sessionId, chat) {
  await query(
    `INSERT INTO wa_chats (session_id, jid, name, is_group, unread_count, pinned)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     name = COALESCE(VALUES(name), name),
     pinned = VALUES(pinned)`,
    [
      sessionId, chat.id,
      chat.name || null,
      isJidGroup(chat.id) ? 1 : 0,
      chat.unreadCount || 0,
      chat.pinned ? 1 : 0,
    ]
  );
}

// ================================================
// Kirim pesan teks (VERSI PERBAIKAN)
// ================================================
export async function sendTextMessage(sessionId, to, text, quotedMsgId = null) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Sesi tidak ditemukan atau tidak aktif');

  const { sock } = session;
  const jid = formatJid(to);

  let messageOptions = { text };

  if (quotedMsgId) {
    const quotedMsg = await queryOne(
      'SELECT raw_data, from_jid, chat_jid FROM wa_messages WHERE session_id = ? AND message_id = ?',
      [sessionId, quotedMsgId]
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

  // 1. Kirim pesan via Baileys
  const sent = await sock.sendMessage(jid, messageOptions);

  // 2. Proses pesan yang baru saja dikirim agar formatnya standar
  const processed = await processMessage(sessionId, sent, sock);

  if (processed) {
    // 3. SIMPAN KE DATABASE (PENTING!)
    await saveMessage(sessionId, processed);

    // 4. UPDATE DATA CHAT (PENTING!)
    await updateChat(sessionId, processed);

    // 5. KIRIM KE FRONTEND VIA SOCKET agar langsung muncul tanpa refresh
    const io = session.io; // Ambil io dari instance session
    io.emit(`message:new:${sessionId}`, processed);
    io.emit(`chat:update:${sessionId}`, { chatJid: processed.chatJid });
  }

  return sent;
}

// ================================================
// Kirim pesan media (gambar/video/dokumen)
// ================================================
export async function sendMediaMessage(sessionId, to, mediaBuffer, mimeType, caption = '', filename = '') {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Sesi tidak ditemukan');

  const { sock } = session;
  const jid = formatJid(to);

  let msgContent = {};
  if (mimeType.startsWith('image/')) {
    msgContent = { image: mediaBuffer, caption };
  } else if (mimeType.startsWith('video/')) {
    msgContent = { video: mediaBuffer, caption };
  } else if (mimeType.startsWith('audio/')) {
    msgContent = { audio: mediaBuffer, mimetype: mimeType, ptt: mimeType.includes('ogg') };
  } else {
    msgContent = { document: mediaBuffer, mimetype: mimeType, fileName: filename };
  }

  const sent = await sock.sendMessage(jid, msgContent);
  return sent;
}

// ================================================
// Tandai pesan sebagai sudah dibaca
// ================================================
export async function markAsRead(sessionId, chatJid) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const { sock } = session;
  const jid = formatJid(chatJid);

  // Ambil pesan yang belum dibaca
  const unreadMessages = await query(
    `SELECT message_id, from_jid FROM wa_messages 
     WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0 AND status != 'read'
     ORDER BY timestamp DESC LIMIT 20`,
    [sessionId, chatJid]
  );

  if (unreadMessages.length > 0) {
    const keys = unreadMessages.map(m => ({
      remoteJid: jid,
      id: m.message_id,
      participant: isJidGroup(jid) ? m.from_jid : undefined,
    }));

    await sock.readMessages(keys);
  }

  // Update unread count di database
  await query(
    'UPDATE wa_chats SET unread_count = 0 WHERE session_id = ? AND jid = ?',
    [sessionId, chatJid]
  );

  await query(
    "UPDATE wa_messages SET status = 'read' WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0",
    [sessionId, chatJid]
  );
}

// ================================================
// Hapus pesan
// ================================================
export async function deleteMessage(sessionId, chatJid, messageId, forEveryone = false) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Sesi tidak ditemukan');

  const { sock } = session;
  const jid = formatJid(chatJid);

  if (forEveryone) {
    await sock.sendMessage(jid, { delete: { remoteJid: jid, id: messageId, fromMe: true } });
  }

  await query(
    'UPDATE wa_messages SET is_deleted = 1, content = "[Pesan dihapus]" WHERE session_id = ? AND message_id = ?',
    [sessionId, messageId]
  );
}

// ================================================
// Logout / disconnect sesi
// ================================================
export async function logoutSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    await session.sock.logout();
    sessions.delete(sessionId);
  }

  await query(
    'UPDATE wa_sessions SET status = ?, qr_code = NULL WHERE id = ?',
    ['disconnected', sessionId]
  );

  const sessionDir = `./sessions/${sessionId}`;
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true });
  }
}

// ================================================
// Get info sesi dari database
// ================================================
export async function getSessionInfo(sessionId) {
  return await queryOne('SELECT * FROM wa_sessions WHERE id = ?', [sessionId]);
}

// ================================================
// Cek apakah sesi sedang aktif (terkoneksi)
// ================================================
export function isSessionConnected(sessionId) {
  const session = sessions.get(sessionId);
  return session?.sock?.user != null;
}

// ================================================
// Helper: Format JID
// ================================================
function formatJid(phone) {
  // Jika sudah berformat JID, kembalikan langsung
  if (phone.includes('@')) return phone;

  // Bersihkan nomor
  let number = phone.replace(/[^0-9]/g, '');
  if (number.startsWith('0')) number = '62' + number.substring(1);
  if (!number.startsWith('62')) number = '62' + number;

  return `${number}@s.whatsapp.net`;
}

export { sessions };