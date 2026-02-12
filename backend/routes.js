// routes.js - Semua API Routes
import express from "express";
import multer from "multer";
import { query, queryOne } from "./db.js";
import {
  createSession,
  sendTextMessage,
  sendMediaMessage,
  markAsRead,
  deleteMessage,
  logoutSession,
  isSessionConnected,
} from "./whatsapp.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ===============================================
// HELPER: Bangun filter WHERE berdasarkan period & sessionId
// ===============================================

/**
 * Menghasilkan klausa SQL untuk filter waktu.
 * @param {string} period - "today" | "yesterday" | "week" | "month"
 * @param {string} column - nama kolom timestamp, default "timestamp"
 */
// --- Helper: Membangun filter tanggal berdasarkan periode ---
const buildPeriodFilter = (period, columnName) => {
  switch (period) {
    case "Hari ini":
    case "today":
      return `DATE(${columnName}) = CURDATE()`;
    case "Kemarin":
    case "yesterday":
      return `DATE(${columnName}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`;
    case "Minggu":
    case "week":
      return `YEARWEEK(${columnName}, 1) = YEARWEEK(CURDATE(), 1)`;
    case "Bulan":
    case "month":
      return `MONTH(${columnName}) = MONTH(CURDATE()) AND YEAR(${columnName}) = YEAR(CURDATE())`;
    default:
      return "1=1"; // Tampilkan semua jika tidak cocok
  }
};

// ===============================================
// SESSION ROUTES
// ===============================================

// GET: Ambil semua sesi
router.get("/sessions", async (req, res) => {
  const sessions = await query(
    "SELECT id, name, phone_number, status, connected_at, created_at FROM wa_sessions ORDER BY created_at DESC",
  );
  res.json({ success: true, data: sessions });
});

// GET: Info sesi spesifik
router.get("/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const session = await queryOne("SELECT * FROM wa_sessions WHERE id = ?", [
    sessionId,
  ]);
  if (!session)
    return res
      .status(404)
      .json({ success: false, message: "Sesi tidak ditemukan" });
  session.is_connected = isSessionConnected(sessionId);
  res.json({ success: true, data: session });
});

// POST: Buat sesi baru
router.post("/sessions", async (req, res) => {
  const { sessionId, name } = req.body;
  const io = req.app.get("io");

  if (!sessionId || !name) {
    return res.status(400).json({
      success: false,
      message: "Session ID dan Nama Perangkat wajib diisi",
    });
  }

  try {
    const existing = await queryOne("SELECT id FROM wa_sessions WHERE id = ?", [
      sessionId,
    ]);

    if (!existing) {
      await query(
        "INSERT INTO wa_sessions (id, name, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [sessionId, name, "connecting"],
      );
    } else {
      await query(
        "UPDATE wa_sessions SET name = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [name, "connecting", sessionId],
      );
    }

    await createSession(sessionId, io);

    res.json({
      success: true,
      sessionId,
      message: `Sesi ${name} diinisialisasi.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Hapus Sesi Permanen
router.delete("/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    try {
      await logoutSession(sessionId);
    } catch (e) {
      console.log(
        "Socket sudah tidak aktif atau gagal logout, lanjut hapus data.",
      );
    }

    await query("DELETE FROM wa_sessions WHERE id = ?", [sessionId]);

    const fs = await import("fs");
    const path = await import("path");
    const sessionDir = path.join(process.cwd(), "sessions", sessionId);

    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`Folder sessions/${sessionId} dihapus.`);
    }

    res.json({
      success: true,
      message: "Perangkat dan semua data berhasil dihapus",
    });
  } catch (err) {
    console.error("Error delete session:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: QR Code untuk sesi
router.get("/sessions/:sessionId/qr", async (req, res) => {
  const { sessionId } = req.params;
  const session = await queryOne(
    "SELECT qr_code, status FROM wa_sessions WHERE id = ?",
    [sessionId],
  );
  if (!session)
    return res
      .status(404)
      .json({ success: false, message: "Sesi tidak ditemukan" });
  res.json({
    success: true,
    data: { qr: session.qr_code, status: session.status },
  });
});

// ===============================================
// STATS ROUTES - DASHBOARD UTAMA
// ===============================================

// ===============================================
// STATS ROUTES - DASHBOARD UTAMA
// ===============================================

router.get("/stats/dashboard", async (req, res) => {
  try {
    const { period = "Hari ini", sessionId } = req.query;

    // 1. Parameter filter untuk query Device
    const sessionFilter = sessionId && sessionId !== "Semua Device" && sessionId !== "all" 
      ? `AND m.session_id = ?` 
      : "";
    const sessionParams = sessionId && sessionId !== "Semua Device" && sessionId !== "all" 
      ? [sessionId] 
      : [];

    // 2. Build Period Filter (Gunakan fungsi helper Anda)
    const periodFilter = buildPeriodFilter(period, "m.timestamp");

    // ── 1. Total pesan masuk (KESELURUHAN / ALL TIME) ────────────────────
    // Ini digunakan untuk angka besar di "Inbound Total" pada Live Stream
    const [rowPesanMasukAllTime] = await query(
      `SELECT COUNT(*) AS count
       FROM wa_messages m
       WHERE m.is_from_me = 0
       AND m.chat_jid NOT LIKE '%@g.us'
       ${sessionFilter}`,
      [...sessionParams]
    );

    // ── 2. Pesan masuk (SESUAI PERIODE) ───────────────────────────────
    // Digunakan untuk Stat Card "Masuk Periode Ini"
    const [rowPesanMasukPeriod] = await query(
      `SELECT COUNT(*) AS count
       FROM wa_messages m
       WHERE m.is_from_me = 0
       AND m.chat_jid NOT LIKE '%@g.us'
       AND ${periodFilter}
       ${sessionFilter}`,
      [...sessionParams]
    );

    // ── 3. Pesan terkirim (SESUAI PERIODE) ─────────────────────────────
    const [rowPesanKeluar] = await query(
      `SELECT COUNT(*) AS count
       FROM wa_messages m
       WHERE m.is_from_me = 1
       AND m.chat_jid NOT LIKE '%@g.us'
       AND ${periodFilter}
       ${sessionFilter}`,
      [...sessionParams]
    );

    // ── 4. Info device ──────────────────────────────────────────────────
    const allSessions = await query(
      `SELECT id, name, status FROM wa_sessions ORDER BY created_at DESC`
    );
    const totalDevice = allSessions.length;
    const deviceConnected = allSessions.filter((s) => s.status === "connected").length;

    // ── 5. Lead Masuk (Kontak baru di periode ini) ─────────────────────
    const [rowLeadMasuk] = await query(
      `SELECT COUNT(DISTINCT m.chat_jid) AS count
       FROM wa_messages m
       WHERE m.is_from_me = 0
       AND m.chat_jid NOT LIKE '%@g.us'
       AND ${periodFilter}
       ${sessionFilter}
       AND NOT EXISTS (
         SELECT 1 FROM wa_messages older
         WHERE older.chat_jid = m.chat_jid
         AND older.timestamp < DATE(NOW())
       )`,
      [...sessionParams]
    );

    // ── 6. Lead Aktif (Pesan masuk dalam 30 menit terakhir) ─────────────
    const [rowLeadAktif] = await query(
      `SELECT COUNT(DISTINCT chat_jid) AS count
       FROM wa_messages m
       WHERE is_from_me = 0
       AND chat_jid NOT LIKE '%@g.us'
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       ${sessionFilter}`,
      [...sessionParams]
    );

    // ── 7. Slow Response (> 10 menit belum dibalas) ───────────────────
    const [rowSlowResponse] = await query(
      `SELECT COUNT(DISTINCT inc.chat_jid) AS count
       FROM wa_messages inc
       WHERE inc.is_from_me = 0
       AND inc.chat_jid NOT LIKE '%@g.us'
       AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ${sessionFilter.replace('m.', 'inc.')}
       AND NOT EXISTS (
         SELECT 1 FROM wa_messages reply
         WHERE reply.chat_jid = inc.chat_jid
         AND reply.is_from_me = 1
         AND reply.timestamp > inc.timestamp
       )`,
      [...sessionParams]
    );

    // ── 8. Tak Terjawab (> 24 jam belum dibalas) ──────────────────────
    const [rowUnanswered] = await query(
      `SELECT COUNT(DISTINCT inc.chat_jid) AS count
       FROM wa_messages inc
       WHERE inc.is_from_me = 0
       AND inc.chat_jid NOT LIKE '%@g.us'
       AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ${sessionFilter.replace('m.', 'inc.')}
       AND NOT EXISTS (
         SELECT 1 FROM wa_messages reply
         WHERE reply.chat_jid = inc.chat_jid
         AND reply.is_from_me = 1
         AND reply.timestamp > inc.timestamp
       )`,
      [...sessionParams]
    );

    // ── 9. Live Messages Feed (Data Terbaru) ───────────────────────────
    const liveMessages = await query(
      `SELECT
          m.id,
          COALESCE(ct.name, ct.push_name, m.from_jid, m.chat_jid) AS sender,
          COALESCE(m.content, m.caption, '[Media]') AS message_text,
          s.name AS received_via,
          DATE_FORMAT(m.timestamp, '%Y-%m-%d %H:%i:%s') AS received_at
       FROM wa_messages m
       LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid
       LEFT JOIN wa_sessions s ON s.id = m.session_id
       WHERE m.is_from_me = 0
       AND m.chat_jid NOT LIKE '%@g.us'
       ${sessionFilter}
       ORDER BY m.timestamp DESC
       LIMIT 20`,
      [...sessionParams]
    );

    // ── 10. Data Tren Pesan (Line Chart) ──────────────────────────────
    let groupBy = "DATE_FORMAT(m.timestamp, '%H:00')";
    if (period === "Minggu" || period === "Bulan") {
      groupBy = "DATE_FORMAT(m.timestamp, '%d %b')";
    }

    const trendData = await query(
      `SELECT 
          ${groupBy} AS time,
          SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) AS masuk,
          SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) AS keluar
       FROM wa_messages m
       WHERE m.chat_jid NOT LIKE '%@g.us'
       AND ${periodFilter}
       ${sessionFilter}
       GROUP BY time
       ORDER BY m.timestamp ASC`,
      [...sessionParams]
    );

    // ── 11. Data Lead per Device (Bar Chart) ──────────────────────────
    const devicePerformance = await query(
      `SELECT 
          s.name,
          COUNT(DISTINCT m.chat_jid) AS lead_count
       FROM wa_sessions s
       LEFT JOIN wa_messages m ON s.id = m.session_id 
          AND m.is_from_me = 0 
          AND m.chat_jid NOT LIKE '%@g.us'
          AND ${periodFilter.replace(/m\./g, 'm.')}
       GROUP BY s.id, s.name`,
      []
    );

    // ── 12. Kirim Respon ke Frontend ───────────────────────────────────
    res.json({
      success: true,
      stats: {
        pesanMasukAllTime: rowPesanMasukAllTime?.count ?? 0, // Untuk angka besar di Live Stream
        pesanMasukToday: rowPesanMasukPeriod?.count ?? 0,   // Untuk Stat Card periode
        pesanKeluar: rowPesanKeluar?.count ?? 0,
        totalDevice,
        deviceConnected,
        leadMasuk: rowLeadMasuk?.count ?? 0,
        leadAktif: rowLeadAktif?.count ?? 0,
        slowResponse: rowSlowResponse?.count ?? 0,
        unanswered: rowUnanswered?.count ?? 0,
      },
      devices: allSessions,
      messages: liveMessages,
      chartData: trendData,
      deviceStats: devicePerformance,
    });
  } catch (err) {
    console.error("Error /stats/dashboard:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET: Statistik per sesi (endpoint lama, tetap dipertahankan)
router.get("/sessions/:sessionId/stats", async (req, res) => {
  const { sessionId } = req.params;
  const [totalChats] = await query(
    "SELECT COUNT(*) as count FROM wa_chats WHERE session_id = ?",
    [sessionId],
  );
  const [totalMessages] = await query(
    "SELECT COUNT(*) as count FROM wa_messages WHERE session_id = ?",
    [sessionId],
  );
  const [unreadChats] = await query(
    "SELECT COUNT(*) as count FROM wa_chats WHERE session_id = ? AND unread_count > 0",
    [sessionId],
  );
  const [todayMessages] = await query(
    "SELECT COUNT(*) as count FROM wa_messages WHERE session_id = ? AND DATE(timestamp) = CURDATE()",
    [sessionId],
  );

  res.json({
    success: true,
    data: {
      totalChats: totalChats.count,
      totalMessages: totalMessages.count,
      unreadChats: unreadChats.count,
      todayMessages: todayMessages.count,
      isConnected: isSessionConnected(sessionId),
    },
  });
});

// ===============================================
// CHAT ROUTES
// ===============================================
router.get("/all-global-messages", async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.*, 
        s.name as session_name,
        COALESCE(ct.name, ct.push_name, ch.name, m.chat_jid) AS display_name,
        ch.unread_count,
        ct.profile_pic_url
      FROM wa_messages m
      INNER JOIN (
        SELECT MAX(id) as last_id
        FROM wa_messages
        WHERE is_from_me = 0
        AND chat_jid NOT LIKE '%@g.us'
        GROUP BY chat_jid, session_id
      ) latest ON m.id = latest.last_id
      LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid
      LEFT JOIN wa_chats ch ON ch.session_id = m.session_id AND ch.jid = m.chat_jid
      LEFT JOIN wa_sessions s ON s.id = m.session_id
      WHERE (ch.is_group = 0 OR ch.is_group IS NULL)
      ORDER BY m.timestamp DESC
      LIMIT 100
    `;

    const messages = await query(sql);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: Daftar semua chat
router.get("/sessions/:sessionId/chats", async (req, res) => {
  const { sessionId } = req.params;
  const { search = "", page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT c.*, 
           COALESCE(ct.name, ct.push_name, c.name) AS display_name,
           ct.profile_pic_url
    FROM wa_chats c
    LEFT JOIN wa_contacts ct ON ct.session_id = c.session_id AND ct.jid = c.jid
    WHERE c.session_id = ? 
    AND c.is_group = 0
    AND EXISTS (
      SELECT 1 FROM wa_messages m 
      WHERE m.session_id = c.session_id 
      AND m.chat_jid = c.jid 
      AND m.is_from_me = 0
    )
  `;
  const params = [sessionId];

  if (search) {
    sql += " AND (c.name LIKE ? OR c.jid LIKE ? OR ct.name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY c.pinned DESC, c.last_message_time DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  try {
    const chats = await query(sql, params);
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: Pesan dalam satu chat
router.get("/sessions/:sessionId/chats/:chatJid/messages", async (req, res) => {
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
    sql += " AND m.timestamp < ?";
    params.push(new Date(before));
  }

  sql += " ORDER BY m.timestamp DESC LIMIT ?";
  params.push(parseInt(limit));

  const messages = await query(sql, params);
  messages.reverse();
  res.json({ success: true, data: messages });
});

// PUT: Mark chat as read
router.put("/sessions/:sessionId/chats/:chatJid/read", async (req, res) => {
  const { sessionId, chatJid } = req.params;
  const decodedJid = decodeURIComponent(chatJid);
  try {
    await markAsRead(sessionId, decodedJid);
    res.json({ success: true, message: "Chat ditandai sudah dibaca" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// MESSAGE ROUTES
// ===============================================

// POST: Kirim pesan teks
router.post("/sessions/:sessionId/messages/text", async (req, res) => {
  const { sessionId } = req.params;
  const { to, text, quotedMsgId } = req.body;

  if (!to || !text) {
    return res.status(400).json({
      success: false,
      message: 'Parameter "to" dan "text" wajib diisi',
    });
  }

  try {
    const sent = await sendTextMessage(sessionId, to, text, quotedMsgId);
    res.json({ success: true, data: sent, message: "Pesan berhasil dikirim" });
  } catch (err) {
    console.error("Error kirim pesan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Kirim pesan media
router.post(
  "/sessions/:sessionId/messages/media",
  upload.single("file"),
  async (req, res) => {
    const { sessionId } = req.params;
    const { to, caption = "" } = req.body;

    if (!to || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "to" dan file wajib diisi',
      });
    }

    try {
      const sent = await sendMediaMessage(
        sessionId,
        to,
        req.file.buffer,
        req.file.mimetype,
        caption,
        req.file.originalname,
      );
      res.json({
        success: true,
        data: sent,
        message: "Media berhasil dikirim",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// DELETE: Hapus pesan
router.delete("/sessions/:sessionId/messages/:messageId", async (req, res) => {
  const { sessionId, messageId } = req.params;
  const { chatJid, forEveryone = false } = req.body;

  try {
    await deleteMessage(sessionId, chatJid, messageId, forEveryone);
    res.json({ success: true, message: "Pesan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// CONTACT ROUTES
// ===============================================

// GET: Daftar kontak
router.get("/sessions/:sessionId/contacts", async (req, res) => {
  const { sessionId } = req.params;
  const { search = "" } = req.query;

  try {
    let sql = `
      SELECT * FROM wa_contacts 
      WHERE session_id = ? AND is_group = 0 
    `;
    const params = [sessionId];

    if (search) {
      sql +=
        " AND (name LIKE ? OR push_name LIKE ? OR phone_number LIKE ? OR jid LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY 
      CASE 
        WHEN name IS NOT NULL AND name != '' THEN 1 
        WHEN push_name IS NOT NULL AND push_name != '' THEN 2 
        ELSE 3 
      END, 
      name ASC, 
      push_name ASC 
      LIMIT 100`;

    const contacts = await query(sql, params);
    res.json({ success: true, data: contacts || [] });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil daftar kontak" });
  }
});

// ===============================================
// GROUP ROUTES
// ===============================================

router.get("/sessions/:sessionId/groups", async (req, res) => {
  const { sessionId } = req.params;
  const { search = "" } = req.query;

  let sql = `
    SELECT 
      c.*,
      COALESCE(NULLIF(TRIM(c.name), ''), g.subject, REPLACE(c.jid, '@g.us', '')) AS display_name,
      COALESCE(ct.name, ct.push_name, c.last_message_from) AS last_message_from_name,
      g.subject AS group_subject,
      g.profile_pic_url,
      g.participant_count
    FROM wa_chats c
    LEFT JOIN wa_groups g ON g.session_id = c.session_id AND g.jid = c.jid
    LEFT JOIN wa_contacts ct ON ct.session_id = c.session_id AND ct.jid = c.last_message_from
    WHERE c.session_id = ? 
      AND (c.is_group = 1 OR c.jid LIKE '%@g.us')
  `;

  const params = [sessionId];
  if (search) {
    sql += ` AND (c.name LIKE ? OR g.subject LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY c.pinned DESC, c.last_message_time DESC";

  try {
    const groups = await query(sql, params);
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: Anggota sebuah grup
router.get(
  "/sessions/:sessionId/groups/:groupJid/participants",
  async (req, res) => {
    const { sessionId, groupJid } = req.params;
    const decodedJid = decodeURIComponent(groupJid);

    try {
      const participants = await query(
        `SELECT 
         gp.participant_jid AS jid,
         gp.role,
         COALESCE(c.name, c.push_name, gp.participant_jid) AS display_name,
         c.profile_pic_url
       FROM wa_group_participants gp
       LEFT JOIN wa_contacts c 
              ON c.session_id = gp.session_id 
             AND c.jid = gp.participant_jid
       WHERE gp.session_id = ? AND gp.group_jid = ?
       ORDER BY 
         FIELD(gp.role, 'superadmin', 'admin', 'member'),
         display_name ASC`,
        [sessionId, decodedJid],
      );
      res.json({ success: true, data: participants });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// GET: Pesan dalam sebuah grup
router.get("/sessions/:sessionId/groups/:jid/messages", async (req, res) => {
  const { sessionId, jid } = req.params;
  const decodedJid = decodeURIComponent(jid);
  const { before, limit = 40 } = req.query;

  let sql = `
    SELECT 
      m.*,
      COALESCE(ct.name, ct.push_name, gp.participant_jid, m.from_jid) AS sender_name,
      ct.profile_pic_url AS sender_pic
    FROM wa_messages m
    LEFT JOIN wa_contacts ct 
      ON ct.session_id = m.session_id AND ct.jid = m.from_jid
    LEFT JOIN wa_group_participants gp
      ON gp.session_id = m.session_id
      AND gp.group_jid = m.chat_jid
      AND gp.participant_jid = m.from_jid
    WHERE m.session_id = ? AND m.chat_jid = ?
  `;

  const params = [sessionId, decodedJid];

  if (before) {
    sql += " AND m.timestamp < ?";
    params.push(new Date(before));
  }

  sql += " ORDER BY m.timestamp DESC LIMIT ?";
  params.push(parseInt(limit));

  try {
    const messages = await query(sql, params);
    messages.reverse();

    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      sender_name: msg.sender_name
        ? msg.sender_name.replace(/@lid|@c\.us|@s\.whatsapp\.net/g, "")
        : "Anggota",
    }));

    console.log(
      `✅ Loaded ${cleanedMessages.length} messages from group ${decodedJid}`,
    );
    res.json({ success: true, data: cleanedMessages });
  } catch (err) {
    console.error("❌ Error loading group messages:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Kirim pesan teks ke grup
router.post(
  "/sessions/:sessionId/groups/:groupJid/messages",
  async (req, res) => {
    const { sessionId, groupJid } = req.params;
    const { text, quotedMsgId } = req.body;
    const decodedJid = decodeURIComponent(groupJid);

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Teks pesan tidak boleh kosong" });
    }

    try {
      const sent = await sendTextMessage(
        sessionId,
        decodedJid,
        text.trim(),
        quotedMsgId || null,
      );
      res.json({
        success: true,
        data: sent,
        message: "Pesan grup berhasil dikirim",
      });
    } catch (err) {
      console.error("Error kirim pesan grup:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// PUT: Mark pesan grup sebagai sudah dibaca
router.put("/sessions/:sessionId/groups/:groupJid/read", async (req, res) => {
  const { sessionId, groupJid } = req.params;
  const decodedJid = decodeURIComponent(groupJid);
  try {
    await markAsRead(sessionId, decodedJid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================================
// LABEL ROUTES - NEW FEATURE
// ===============================================
// LABEL ROUTES - NEW FEATURE
// ===============================================

// GET: Ambil semua label untuk session
router.get("/sessions/:sessionId/labels", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const labels = await query(
      `SELECT l.*, 
              COUNT(DISTINCT cl.chat_jid) as chat_count
       FROM wa_labels l
       LEFT JOIN wa_chat_labels cl ON cl.label_id = l.id AND cl.session_id = l.session_id
       WHERE l.session_id = ?
       GROUP BY l.id
       ORDER BY l.sort_order ASC, l.created_at DESC`,
      [sessionId]
    );
    res.json({ success: true, data: labels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Buat label baru
router.post("/sessions/:sessionId/labels", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, color = '#00a884', icon = 'tag', description = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Nama label wajib diisi" 
      });
    }

    // Check if label already exists
    const existing = await queryOne(
      "SELECT id FROM wa_labels WHERE session_id = ? AND name = ?",
      [sessionId, name.trim()]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Label dengan nama ini sudah ada"
      });
    }

    const result = await query(
      `INSERT INTO wa_labels (session_id, name, color, icon, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, name.trim(), color, icon, description]
    );

    const newLabel = await queryOne(
      "SELECT * FROM wa_labels WHERE id = ?",
      [result.insertId]
    );

    res.json({ 
      success: true, 
      data: newLabel,
      message: "Label berhasil dibuat" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT: Update label
router.put("/sessions/:sessionId/labels/:labelId", async (req, res) => {
  try {
    const { sessionId, labelId } = req.params;
    const { name, color, icon, description } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (color !== undefined) {
      updates.push("color = ?");
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push("icon = ?");
      params.push(icon);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diupdate"
      });
    }

    params.push(sessionId, labelId);

    await query(
      `UPDATE wa_labels SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE session_id = ? AND id = ?`,
      params
    );

    const updated = await queryOne(
      "SELECT * FROM wa_labels WHERE session_id = ? AND id = ?",
      [sessionId, labelId]
    );

    res.json({ 
      success: true, 
      data: updated,
      message: "Label berhasil diupdate" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Hapus label
router.delete("/sessions/:sessionId/labels/:labelId", async (req, res) => {
  try {
    const { sessionId, labelId } = req.params;

    // Delete akan cascade ke wa_chat_labels karena foreign key
    await query(
      "DELETE FROM wa_labels WHERE session_id = ? AND id = ?",
      [sessionId, labelId]
    );

    res.json({ 
      success: true, 
      message: "Label berhasil dihapus" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: Ambil label untuk chat tertentu
router.get("/sessions/:sessionId/chats/:chatJid/labels", async (req, res) => {
  try {
    const { sessionId, chatJid } = req.params;
    const decodedJid = decodeURIComponent(chatJid);

    const labels = await query(
      `SELECT l.* 
       FROM wa_labels l
       INNER JOIN wa_chat_labels cl ON cl.label_id = l.id
       WHERE cl.session_id = ? AND cl.chat_jid = ?
       ORDER BY l.sort_order ASC, l.name ASC`,
      [sessionId, decodedJid]
    );

    res.json({ success: true, data: labels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Assign label ke chat
router.post("/sessions/:sessionId/chats/:chatJid/labels", async (req, res) => {
  try {
    const { sessionId, chatJid } = req.params;
    const { labelId } = req.body;
    const decodedJid = decodeURIComponent(chatJid);

    if (!labelId) {
      return res.status(400).json({
        success: false,
        message: "Label ID wajib diisi"
      });
    }

    // Check if label exists
    const label = await queryOne(
      "SELECT id FROM wa_labels WHERE session_id = ? AND id = ?",
      [sessionId, labelId]
    );

    if (!label) {
      return res.status(404).json({
        success: false,
        message: "Label tidak ditemukan"
      });
    }

    // Check if already assigned
    const existing = await queryOne(
      "SELECT id FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND label_id = ?",
      [sessionId, decodedJid, labelId]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Label sudah ditambahkan ke chat ini"
      });
    }

    await query(
      "INSERT INTO wa_chat_labels (session_id, chat_jid, label_id) VALUES (?, ?, ?)",
      [sessionId, decodedJid, labelId]
    );

    res.json({ 
      success: true, 
      message: "Label berhasil ditambahkan ke chat" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Remove label dari chat
router.delete("/sessions/:sessionId/chats/:chatJid/labels/:labelId", async (req, res) => {
  try {
    const { sessionId, chatJid, labelId } = req.params;
    const decodedJid = decodeURIComponent(chatJid);

    await query(
      "DELETE FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND label_id = ?",
      [sessionId, decodedJid, labelId]
    );

    res.json({ 
      success: true, 
      message: "Label berhasil dihapus dari chat" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



export default router;
