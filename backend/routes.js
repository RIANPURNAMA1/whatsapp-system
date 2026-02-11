// routes.js - Semua API Routes
import express from 'express';
import multer from 'multer';
import { query, queryOne } from './db.js';
import {
  createSession,
  sendTextMessage,
  sendMediaMessage,
  markAsRead,
  deleteMessage,
  logoutSession,
  isSessionConnected,
} from './whatsapp.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ===============================================
// SESSION ROUTES
// ===============================================



// GET: Ambil semua sesi
router.get('/sessions', async (req, res) => {
  const sessions = await query('SELECT id, name, phone_number, status, connected_at, created_at FROM wa_sessions ORDER BY created_at DESC');
  res.json({ success: true, data: sessions });
});

// GET: Info sesi spesifik
router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = await queryOne('SELECT * FROM wa_sessions WHERE id = ?', [sessionId]);
  if (!session) return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
  session.is_connected = isSessionConnected(sessionId);
  res.json({ success: true, data: session });
});

// POST: Buat sesi baru
router.post('/sessions', async (req, res) => {
  // Ambil sessionId dari body (yang kita kirim dari frontend tadi)
  // Jika tidak ada, baru pakai 'default'
  const { sessionId, name = 'Device Baru' } = req.body;
  const io = req.app.get('io');

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID wajib disertakan' });
  }

  try {
    // 1. Cek apakah session ID ini sudah ada di database
    const existing = await queryOne('SELECT id FROM wa_sessions WHERE id = ?', [sessionId]);
    
    if (!existing) {
      // 2. Jika BELUM ADA, maka INSERT baris baru (Ini yang bikin device nambah di list)
      await query(
        'INSERT INTO wa_sessions (id, name, status, created_at) VALUES (?, ?, ?, NOW())', 
        [sessionId, name, 'connecting']
      );
    } else {
      // 3. Jika SUDAH ADA, cukup update statusnya
      await query('UPDATE wa_sessions SET status = ? WHERE id = ?', ['connecting', sessionId]);
    }

    // 4. Jalankan Baileys untuk ID unik tersebut
    // Fungsi createSession di whatsapp.js kamu sudah benar karena pakai: ./sessions/${sessionId}
    await createSession(sessionId, io);
    
    res.json({ 
      success: true, 
      sessionId, // Kembalikan ID-nya agar frontend tahu mana yang sedang diproses
      message: 'Sesi baru diinisialisasi. Silakan scan QR.' 
    });
  } catch (err) {
    console.error('Error buat sesi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Logout sesi
router.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    await logoutSession(sessionId);
    res.json({ success: true, message: 'Berhasil logout' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: QR Code untuk sesi
router.get('/sessions/:sessionId/qr', async (req, res) => {
  const { sessionId } = req.params;
  const session = await queryOne('SELECT qr_code, status FROM wa_sessions WHERE id = ?', [sessionId]);
  if (!session) return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
  res.json({ success: true, data: { qr: session.qr_code, status: session.status } });
});

// ===============================================
// CHAT ROUTES
// ===============================================

// GET: Daftar semua chat
router.get('/sessions/:sessionId/chats', async (req, res) => {
  const { sessionId } = req.params;
  const { search = '', page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT c.*, 
           COALESCE(ct.name, ct.push_name, c.name) AS display_name,
           ct.profile_pic_url
    FROM wa_chats c
    LEFT JOIN wa_contacts ct ON ct.session_id = c.session_id AND ct.jid = c.jid
    WHERE c.session_id = ?
  `;
  const params = [sessionId];

  if (search) {
    sql += ' AND (c.name LIKE ? OR c.jid LIKE ? OR ct.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY c.pinned DESC, c.last_message_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const chats = await query(sql, params);
  res.json({ success: true, data: chats });
});

// GET: Pesan dalam satu chat
router.get('/sessions/:sessionId/chats/:chatJid/messages', async (req, res) => {
  const { sessionId, chatJid } = req.params;
  const { before, limit = 30 } = req.query;
  const decodedJid = decodeURIComponent(chatJid);

  let sql = `
    SELECT m.*, 
           COALESCE(c.name, c.push_name) AS sender_name
    FROM wa_messages m
    LEFT JOIN wa_contacts c ON c.session_id = m.session_id AND c.jid = m.from_jid
    WHERE m.session_id = ? AND m.chat_jid = ?
  `;
  const params = [sessionId, decodedJid];

  if (before) {
    sql += ' AND m.timestamp < ?';
    params.push(new Date(before));
  }

  sql += ' ORDER BY m.timestamp DESC LIMIT ?';
  params.push(parseInt(limit));

  const messages = await query(sql, params);
  messages.reverse(); // Urutkan dari lama ke baru
  res.json({ success: true, data: messages });
});

// PUT: Mark chat as read
router.put('/sessions/:sessionId/chats/:chatJid/read', async (req, res) => {
  const { sessionId, chatJid } = req.params;
  const decodedJid = decodeURIComponent(chatJid);
  try {
    await markAsRead(sessionId, decodedJid);
    res.json({ success: true, message: 'Chat ditandai sudah dibaca' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// MESSAGE ROUTES
// ===============================================

// POST: Kirim pesan teks
router.post('/sessions/:sessionId/messages/text', async (req, res) => {
  const { sessionId } = req.params;
  const { to, text, quotedMsgId } = req.body;

  if (!to || !text) {
    return res.status(400).json({ success: false, message: 'Parameter "to" dan "text" wajib diisi' });
  }

  try {
    const sent = await sendTextMessage(sessionId, to, text, quotedMsgId);
    res.json({ success: true, data: sent, message: 'Pesan berhasil dikirim' });
  } catch (err) {
    console.error('Error kirim pesan:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Kirim pesan media
router.post('/sessions/:sessionId/messages/media', upload.single('file'), async (req, res) => {
  const { sessionId } = req.params;
  const { to, caption = '' } = req.body;

  if (!to || !req.file) {
    return res.status(400).json({ success: false, message: 'Parameter "to" dan file wajib diisi' });
  }

  try {
    const sent = await sendMediaMessage(
      sessionId, to,
      req.file.buffer,
      req.file.mimetype,
      caption,
      req.file.originalname
    );
    res.json({ success: true, data: sent, message: 'Media berhasil dikirim' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Hapus pesan
router.delete('/sessions/:sessionId/messages/:messageId', async (req, res) => {
  const { sessionId, messageId } = req.params;
  const { chatJid, forEveryone = false } = req.body;

  try {
    await deleteMessage(sessionId, chatJid, messageId, forEveryone);
    res.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// CONTACT ROUTES
// ===============================================

// GET: Daftar kontak
router.get('/sessions/:sessionId/contacts', async (req, res) => {
  const { sessionId } = req.params;
  const { search = '' } = req.query;

  let sql = 'SELECT * FROM wa_contacts WHERE session_id = ? AND is_group = 0';
  const params = [sessionId];

  if (search) {
    sql += ' AND (name LIKE ? OR push_name LIKE ? OR phone_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY COALESCE(name, push_name) ASC LIMIT 200';

  const contacts = await query(sql, params);
  res.json({ success: true, data: contacts });
});

// ===============================================
// STATS ROUTES
// ===============================================

// GET: Statistik dashboard
router.get('/sessions/:sessionId/stats', async (req, res) => {
  const { sessionId } = req.params;
  const [totalChats] = await query('SELECT COUNT(*) as count FROM wa_chats WHERE session_id = ?', [sessionId]);
  const [totalMessages] = await query('SELECT COUNT(*) as count FROM wa_messages WHERE session_id = ?', [sessionId]);
  const [unreadChats] = await query('SELECT COUNT(*) as count FROM wa_chats WHERE session_id = ? AND unread_count > 0', [sessionId]);
  const [todayMessages] = await query(
    'SELECT COUNT(*) as count FROM wa_messages WHERE session_id = ? AND DATE(timestamp) = CURDATE()',
    [sessionId]
  );

  res.json({
    success: true,
    data: {
      totalChats: totalChats.count,
      totalMessages: totalMessages.count,
      unreadChats: unreadChats.count,
      todayMessages: todayMessages.count,
      isConnected: isSessionConnected(sessionId),
    }
  });
});

export default router;