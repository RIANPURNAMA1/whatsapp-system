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
  getSessionInfo, // ⭐ TAMBAHKAN INI
  sessions, // ⭐ TAMBAHKAN INI
} from "./whatsapp.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const router = express.Router();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

/**
 * HELPER: Membangun filter SQL berdasarkan periode atau custom date
 * Disesuaikan dengan struktur switch-case milik Anda
 */
/**
 * HELPER: Membangun filter SQL berdasarkan periode atau custom date
 */
const buildPeriodFilter = (period, columnName, startDate, endDate) => {
  // Helper untuk membersihkan format tanggal dari Frontend
  const formatYMD = (dateStr) => {
    if (!dateStr) return null;
    // Jika formatnya ISO (ada huruf T), ambil bagian tanggalnya saja
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  };

  switch (
    period?.toLowerCase() // Pakai toLowerCase agar lebih aman
  ) {
    case "hari ini":
    case "today":
      // Jauh lebih cepat daripada DATE(col) = CURDATE()
      return `${columnName} >= CURDATE()`;

    case "kemarin":
    case "yesterday":
      return `${columnName} >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND ${columnName} < CURDATE()`;

    case "minggu":
    case "week":
      // Mengambil 7 hari terakhir agar INDEX tetap terpakai
      return `${columnName} >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;

    case "bulan":
    case "month":
      // Mengambil 30 hari terakhir (lebih akurat untuk bisnis daripada hitung bulan kalender)
      return `${columnName} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;

    case "custom":
      const s = formatYMD(startDate);
      const e = formatYMD(endDate);
      if (s && e) {
        return `${columnName} BETWEEN '${s} 00:00:00' AND '${e} 23:59:59'`;
      }
      return `${columnName} >= CURDATE()`;

    default:
      return "1=1";
  }
};

const JWT_SECRET =
  "918cfb63fffbbc45a16b96beb5fca0deb9a33f0b2180997cc2f15b2affeab1e393c1630e3e9cb02aaf3fe5ae64fbaad1e5c03df2bbe29ca4ba9792c5c1f7ad0a";

// --- LETAKKAN DI SINI ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "Akses ditolak" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ success: false, message: "Token tidak valid" });
    req.user = user; // Data user dari JWT disimpan di sini agar bisa dipakai di route
    next();
  });
};
// -----------------------

// login

// POST: Login User
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // JOIN wa_users dengan sys_roles
    const user = await queryOne(
      `
      SELECT 
        u.id, u.username, u.password, u.full_name, u.branch,
        r.name as role_name, 
        r.type as role_type  -- Mengambil ENUM('system', 'custom') dari tabel sys_roles
      FROM wa_users u
      LEFT JOIN sys_roles r ON u.role_id = r.id
      WHERE u.username = ?
    `,
      [username],
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password salah" });
    }

    // Buat Token JWT
    const token = jwt.sign(
      { id: user.id, role_type: user.role_type },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Kirim objek user yang bersih ke frontend
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        role_type: user.role_type, // Ini akan berisi 'system' atau 'custom'
        branch: user.branch,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// role
// ===============================================
// ROLE MANAGEMENT ROUTES
// ===============================================

// PUT: Update Role
router.put("/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    // Cek apakah role exists dan bukan role sistem
    const role = await queryOne("SELECT type FROM sys_roles WHERE id = ?", [
      id,
    ]);
    if (!role)
      return res
        .status(404)
        .json({ success: false, message: "Role tidak ditemukan" });
    if (role.type === "system")
      return res.status(403).json({
        success: false,
        message: "Role sistem tidak boleh diubah namanya",
      });

    await query("UPDATE sys_roles SET name = ?, description = ? WHERE id = ?", [
      name,
      description,
      id,
    ]);

    res.json({ success: true, message: "Role berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memperbarui role" });
  }
});

// GET: Ambil semua role dan jumlah user-nya
router.get("/roles", async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.*, 
      (SELECT COUNT(*) FROM wa_users u WHERE u.role_id = r.id) as users 
      FROM sys_roles r 
      ORDER BY r.type ASC, r.name ASC
    `);
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Tambah Role Baru
router.post("/roles", async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Nama role wajib diisi" });

  try {
    const result = await query(
      "INSERT INTO sys_roles (name, description, type) VALUES (?, ?, 'custom')",
      [name, description],
    );
    res.json({
      success: true,
      message: "Role berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Role sudah ada atau error database" });
  }
});

// DELETE: Hapus Role
router.delete("/roles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const role = await queryOne("SELECT type FROM sys_roles WHERE id = ?", [
      id,
    ]);
    if (!role)
      return res
        .status(404)
        .json({ success: false, message: "Role tidak ditemukan" });
    if (role.type === "system")
      return res
        .status(403)
        .json({ success: false, message: "Role sistem tidak boleh dihapus" });

    await query("DELETE FROM sys_roles WHERE id = ?", [id]);
    res.json({ success: true, message: "Role berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// USER MANAGEMENT ROUTES (Untuk Admin Cabang/Pusat)
// ===============================================

// GET: Daftar semua user/admin
router.get("/users", async (req, res) => {
  try {
    const users = await query(`
      SELECT u.id, u.username, u.full_name, u.branch, u.last_login, r.name as role_name 
      FROM wa_users u
      LEFT JOIN sys_roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST: Tambah User Baru
// POST: Tambah User Baru (Registration)
router.post("/users", async (req, res) => {
  const { username, password, full_name, role_id, branch } = req.body;

  // 1. Validasi Input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username dan password wajib diisi",
    });
  }

  try {
    // 2. Hash password (Keamanan: Password tidak disimpan sebagai teks biasa)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Simpan ke Database
    await query(
      "INSERT INTO wa_users (username, password, full_name, role_id, branch) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name, role_id, branch],
    );

    res.json({
      success: true,
      message: "User berhasil didaftarkan dengan password aman",
    });
  } catch (err) {
    // Cek jika error karena username duplikat
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ success: false, message: "Username sudah digunakan" });
    }

    console.error("Error Registration:", err);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada database" });
  }
});

// PUT: Update User (Edit)
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, role_id, branch } = req.body;

  try {
    // 1. Cek apakah user ada
    const existingUser = await queryOne(
      "SELECT id FROM wa_users WHERE id = ?",
      [id],
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // 2. Siapkan Query Dasar
    let sql =
      "UPDATE wa_users SET username = ?, full_name = ?, role_id = ?, branch = ?";
    let params = [username, full_name, role_id, branch];

    // 3. Logika Password (Hanya update jika password diisi)
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    // 4. Eksekusi Update
    sql += " WHERE id = ?";
    params.push(id);

    await query(sql, params);

    res.json({
      success: true,
      message: "Data admin berhasil diperbarui",
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan oleh admin lain",
      });
    }
    console.error("Update User Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data database" });
  }
});

// DELETE: Hapus User
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Tambahan: Opsional, cegah penghapusan user admin utama jika perlu
    // const user = await queryOne("SELECT username FROM wa_users WHERE id = ?", [id]);
    // if (user.username === 'superadmin') return res.status(403)...

    await query("DELETE FROM wa_users WHERE id = ?", [id]);
    res.json({ success: true, message: "Akun admin berhasil dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus data dari server" });
  }
});

// ===============================================
// SESSION ROUTES
// ===============================================

router.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type.toLowerCase().trim(); // Standarisasi role

    let sessionsData;

    if (roleType === "system") {
      sessionsData = await query(
        "SELECT * FROM wa_sessions ORDER BY created_at DESC",
      );
    } else {
      // Query ini mencakup Manager & Custom sekaligus
      // Mengambil semua session yang terhubung dengan user ini di tabel pivot
      sessionsData = await query(
        `SELECT s.* FROM wa_sessions s
         INNER JOIN wa_user_sessions us ON s.id = us.session_id
         WHERE us.user_id = ?
         ORDER BY s.created_at DESC`,
        [userId],
      );
    }

    console.log(
      `[DEBUG] User ${userId} (${roleType}) menemukan ${sessionsData.length} sesi`,
    );
    res.json({ success: true, data: sessionsData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
// ===============================================
// SESSION MANAGEMENT ROUTES (System, Manager, Custom)
// ===============================================

/**
 * POST: Buat atau Hubungkan Sesi Baru
 * Mendukung role-based access control untuk System, Manager, dan Custom.
 */
router.post("/sessions", authenticateToken, async (req, res) => {
  const { sessionId, name } = req.body;
  const userId = req.user.id; // Dari JWT payload
  const roleType = req.user.role_type; // Dari JWT payload
  const io = req.app.get("io") || req.app.get("socketio");

  // 1. Validasi Input
  if (!sessionId || !name) {
    return res.status(400).json({
      success: false,
      message: "Session ID dan Nama Perangkat wajib diisi",
    });
  }

  try {
    // 2. Cek apakah session ID sudah ada di database
    const existing = await queryOne("SELECT id FROM wa_sessions WHERE id = ?", [
      sessionId,
    ]);

    if (!existing) {
      // --- A. LOGIKA SESSION BARU ---

      // Simpan ke tabel utama
      await query(
        "INSERT INTO wa_sessions (id, name, status, created_at, updated_at) VALUES (?, ?, 'connecting', NOW(), NOW())",
        [sessionId, name],
      );

      // Jika pendaftar adalah Manager atau Custom, ikat ke tabel pivot
      if (roleType === "manager" || roleType === "custom") {
        await query(
          "INSERT IGNORE INTO wa_user_sessions (user_id, session_id) VALUES (?, ?)",
          [userId, sessionId],
        );
        console.log(
          `[Auth] Akses session ${sessionId} diberikan kepada ${roleType}: ${userId}`,
        );
      }
    } else {
      // --- B. LOGIKA UPDATE / RECONNECT ---

      // Proteksi: Manager dan Custom hanya boleh mengupdate session miliknya sendiri
      if (roleType === "manager" || roleType === "custom") {
        const ownership = await queryOne(
          "SELECT * FROM wa_user_sessions WHERE user_id = ? AND session_id = ?",
          [userId, sessionId],
        );

        if (!ownership) {
          return res.status(403).json({
            success: false,
            message: "Akses ditolak. Anda bukan pemilik perangkat ini.",
          });
        }
      }

      // Update status menjadi connecting
      await query(
        "UPDATE wa_sessions SET name = ?, status = 'connecting', updated_at = NOW() WHERE id = ?",
        [name, sessionId],
      );
    }

    // 3. Inisialisasi Baileys (Async)
    createSession(sessionId, io)
      .then(() => console.log(`[WhatsApp] ${sessionId} mulai menghubungkan...`))
      .catch((e) =>
        console.error(`[WhatsApp] Gagal inisialisasi ${sessionId}:`, e.message),
      );

    res.json({
      success: true,
      sessionId,
      message: `Sesi ${name} sedang diproses...`,
    });
  } catch (err) {
    console.error("Error pada POST /sessions:", err);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server" });
  }
});

/**
 * GET: Ambil Semua Sesi yang Berhak Diakses
 */
// router.get("/sessions", authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const roleType = req.user.role_type;

//     let sessionsData;

//     if (roleType === 'system') {
//       // System Admin melihat SEMUA perangkat tanpa kecuali
//       sessionsData = await query(
//         `SELECT id, name, phone_number, status, connected_at, created_at
//          FROM wa_sessions
//          ORDER BY created_at DESC`
//       );
//     } else {
//       // Manager dan Custom hanya melihat perangkat yang terdaftar di wa_user_sessions
//       // Pastikan fungsi ini tersedia di db.js Anda
//       sessionsData = await query(
//         `SELECT s.id, s.name, s.phone_number, s.status, s.connected_at, s.created_at
//          FROM wa_sessions s
//          JOIN wa_user_sessions us ON s.id = us.session_id
//          WHERE us.user_id = ?
//          ORDER BY s.created_at DESC`,
//         [userId]
//       );
//     }

//     res.json({ success: true, data: sessionsData || [] });
//   } catch (err) {
//     console.error("Error pada GET /sessions:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// ✅ PERBAIKAN ENDPOINT RECONNECT
router.post("/sessions/reconnect/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`🔄 [RECONNECT] Menerima request untuk session: ${sessionId}`);

    // 1. Cek apakah session ada di database
    const sessionData = await getSessionInfo(sessionId);

    if (!sessionData) {
      console.error(
        `❌ [RECONNECT] Session ${sessionId} tidak ditemukan di database`,
      );
      return res.status(404).json({
        success: false,
        message: "Session tidak ditemukan di database",
      });
    }

    // 2. Ambil Socket.IO instance - COBA KEDUA NAMA
    let io = req.app.get("socketio") || req.app.get("io");

    if (!io) {
      console.error(
        "❌ [RECONNECT] Socket.IO instance tidak ditemukan di app!",
      );
      return res.status(500).json({
        success: false,
        message:
          "Socket.IO tidak tersedia di server. Pastikan server sudah diinisialisasi dengan benar.",
      });
    }

    console.log(`✅ [RECONNECT] Socket.IO instance ditemukan`);

    // 3. Hapus session lama dari memori (jika ada)
    if (sessions.has(sessionId)) {
      console.log(
        `🗑️ [RECONNECT] Menghapus session lama dari memori: ${sessionId}`,
      );
      const oldSession = sessions.get(sessionId);

      try {
        if (oldSession?.sock) {
          // Gunakan end() atau ws.terminate() tergantung versi Baileys
          if (typeof oldSession.sock.end === "function") {
            await oldSession.sock.end();
          } else if (oldSession.sock.ws) {
            oldSession.sock.ws.terminate();
          }
          console.log(`✅ [RECONNECT] Socket lama berhasil ditutup`);
        }
      } catch (endError) {
        console.error(
          `⚠️ [RECONNECT] Error saat menutup socket lama:`,
          endError.message,
        );
        // Lanjutkan proses meskipun gagal menutup
      }

      sessions.delete(sessionId);
      console.log(`✅ [RECONNECT] Session ${sessionId} dihapus dari Map`);
    }

    // 4. Update status di database
    await query(
      "UPDATE wa_sessions SET status = 'connecting', qr_code = NULL, updated_at = NOW() WHERE id = ?",
      [sessionId],
    );

    console.log(`✅ [RECONNECT] Status database diupdate ke 'connecting'`);

    // 5. Buat session baru (non-blocking)
    console.log(`🔄 [RECONNECT] Memulai createSession untuk ${sessionId}...`);

    // Jalankan createSession secara async
    createSession(sessionId, io)
      .then(() => {
        console.log(`✅ [RECONNECT] createSession berhasil untuk ${sessionId}`);
      })
      .catch((err) => {
        console.error(
          `❌ [RECONNECT] Error saat createSession(${sessionId}):`,
          err,
        );
        // Update status error ke database
        query(
          "UPDATE wa_sessions SET status = 'error', updated_at = NOW() WHERE id = ?",
          [sessionId],
        ).catch((dbErr) => console.error("Error update status:", dbErr));
      });

    // 6. Response sukses
    res.json({
      success: true,
      message: "Proses reconnect dimulai. Silakan tunggu beberapa saat.",
      sessionId: sessionId,
      status: "connecting",
    });

    console.log(`✅ [RECONNECT] Response sukses dikirim untuk ${sessionId}`);
  } catch (error) {
    console.error("❌ [RECONNECT] ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat reconnect",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Di file routes backend Anda
router.post("/sessions/logout/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Panggil fungsi logoutSession dari file whatsapp.js Anda
    // Fungsi ini akan melakukan sock.logout() dan menghapus folder auth
    await logoutSession(sessionId);

    res.json({ success: true, message: "Logout berhasil" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE: Hapus Sesi Permanen

router.delete("/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    console.log(`[System] Memulai penghapusan permanen sesi: ${sessionId}`);

    // 1. Matikan koneksi WhatsApp & Bersihkan dari Memory/Socket
    // Pastikan fungsi logoutSession Anda juga menghapus instance dari map/objek global
    try {
      await logoutSession(sessionId);
    } catch (e) {
      console.log(
        `[Warn] Sesi ${sessionId} mungkin sudah tidak aktif secara socket, lanjut penghapusan data.`,
      );
    }

    // 2. Hapus Sesi dari Database
    // Karena kita pakai FOREIGN KEY ... ON DELETE CASCADE,
    // semua data di tabel wa_messages, wa_chats, wa_contacts, dll
    // yang memiliki session_id ini akan otomatis DIHAPUS oleh MySQL.
    const result = await query("DELETE FROM wa_sessions WHERE id = ?", [
      sessionId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Sesi tidak ditemukan di database.",
      });
    }

    // 3. Hapus Folder File Session (Auth Info / MD Baileys Data)
    // Kita lakukan secara dinamis agar folder benar-benar hilang dari storage
    const fs = await import("fs");
    const path = await import("path");
    const sessionDir = path.join(process.cwd(), "sessions", sessionId);

    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(
          `[Storage] Folder auth 'sessions/${sessionId}' berhasil dihapus.`,
        );
      } catch (fsErr) {
        console.error(`[Error] Gagal menghapus folder fisik: ${fsErr.message}`);
        // Kita tidak menghentikan respon sukses karena data di DB sudah terhapus
      }
    }

    // 4. Berikan Respon Sukses
    res.json({
      success: true,
      message: `Sesi '${sessionId}' dan seluruh riwayat (pesan, chat, kontak) berhasil dihapus secara permanen dari sistem.`,
    });
  } catch (err) {
    console.error("Critical Error during session deletion:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal saat menghapus sesi.",
      error: err.message,
    });
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

// router.get("/stats/dashboard", async (req, res) => {
//   try {
//     const { period = "Hari ini", sessionId } = req.query;

//     // 1. Parameter filter untuk query Device
//     const sessionFilter = sessionId && sessionId !== "Semua Device" && sessionId !== "all"
//       ? `AND m.session_id = ?`
//       : "";
//     const sessionParams = sessionId && sessionId !== "Semua Device" && sessionId !== "all"
//       ? [sessionId]
//       : [];

//     // 2. Build Period Filter (Gunakan fungsi helper Anda)
//     const periodFilter = buildPeriodFilter(period, "m.timestamp");

//     // ── 1. Total pesan masuk (KESELURUHAN / ALL TIME) ────────────────────
//     // Ini digunakan untuk angka besar di "Inbound Total" pada Live Stream
//     const [rowPesanMasukAllTime] = await query(
//       `SELECT COUNT(*) AS count
//        FROM wa_messages m
//        WHERE m.is_from_me = 0
//        AND m.chat_jid NOT LIKE '%@g.us'
//        ${sessionFilter}`,
//       [...sessionParams]
//     );

//     // ── 2. Pesan masuk (SESUAI PERIODE) ───────────────────────────────
//     // Digunakan untuk Stat Card "Masuk Periode Ini"
//     const [rowPesanMasukPeriod] = await query(
//       `SELECT COUNT(*) AS count
//        FROM wa_messages m
//        WHERE m.is_from_me = 0
//        AND m.chat_jid NOT LIKE '%@g.us'
//        AND ${periodFilter}
//        ${sessionFilter}`,
//       [...sessionParams]
//     );

//     // ── 3. Pesan terkirim (SESUAI PERIODE) ─────────────────────────────
//     const [rowPesanKeluar] = await query(
//       `SELECT COUNT(*) AS count
//        FROM wa_messages m
//        WHERE m.is_from_me = 1
//        AND m.chat_jid NOT LIKE '%@g.us'
//        AND ${periodFilter}
//        ${sessionFilter}`,
//       [...sessionParams]
//     );

//     // ── 4. Info device ──────────────────────────────────────────────────
//     const allSessions = await query(
//       `SELECT id, name, status FROM wa_sessions ORDER BY created_at DESC`
//     );
//     const totalDevice = allSessions.length;
//     const deviceConnected = allSessions.filter((s) => s.status === "connected").length;

//     // ── 5. Lead Masuk (Kontak baru di periode ini) ─────────────────────
//     const [rowLeadMasuk] = await query(
//       `SELECT COUNT(DISTINCT m.chat_jid) AS count
//        FROM wa_messages m
//        WHERE m.is_from_me = 0
//        AND m.chat_jid NOT LIKE '%@g.us'
//        AND ${periodFilter}
//        ${sessionFilter}
//        AND NOT EXISTS (
//          SELECT 1 FROM wa_messages older
//          WHERE older.chat_jid = m.chat_jid
//          AND older.timestamp < DATE(NOW())
//        )`,
//       [...sessionParams]
//     );

//     // ── 6. Lead Aktif (Pesan masuk dalam 30 menit terakhir) ─────────────
//     const [rowLeadAktif] = await query(
//       `SELECT COUNT(DISTINCT chat_jid) AS count
//        FROM wa_messages m
//        WHERE is_from_me = 0
//        AND chat_jid NOT LIKE '%@g.us'
//        AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
//        ${sessionFilter}`,
//       [...sessionParams]
//     );

//     // ── 7. Slow Response (> 10 menit belum dibalas) ───────────────────
//     const [rowSlowResponse] = await query(
//       `SELECT COUNT(DISTINCT inc.chat_jid) AS count
//        FROM wa_messages inc
//        WHERE inc.is_from_me = 0
//        AND inc.chat_jid NOT LIKE '%@g.us'
//        AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
//        ${sessionFilter.replace('m.', 'inc.')}
//        AND NOT EXISTS (
//          SELECT 1 FROM wa_messages reply
//          WHERE reply.chat_jid = inc.chat_jid
//          AND reply.is_from_me = 1
//          AND reply.timestamp > inc.timestamp
//        )`,
//       [...sessionParams]
//     );

//     // ── 8. Tak Terjawab (> 24 jam belum dibalas) ──────────────────────
//     const [rowUnanswered] = await query(
//       `SELECT COUNT(DISTINCT inc.chat_jid) AS count
//        FROM wa_messages inc
//        WHERE inc.is_from_me = 0
//        AND inc.chat_jid NOT LIKE '%@g.us'
//        AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
//        ${sessionFilter.replace('m.', 'inc.')}
//        AND NOT EXISTS (
//          SELECT 1 FROM wa_messages reply
//          WHERE reply.chat_jid = inc.chat_jid
//          AND reply.is_from_me = 1
//          AND reply.timestamp > inc.timestamp
//        )`,
//       [...sessionParams]
//     );

//     // ── 9. Live Messages Feed (Data Terbaru) ───────────────────────────
//     const liveMessages = await query(
//       `SELECT
//           m.id,
//           COALESCE(ct.name, ct.push_name, m.from_jid, m.chat_jid) AS sender,
//           COALESCE(m.content, m.caption, '[Media]') AS message_text,
//           s.name AS received_via,
//           DATE_FORMAT(m.timestamp, '%Y-%m-%d %H:%i:%s') AS received_at
//        FROM wa_messages m
//        LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid
//        LEFT JOIN wa_sessions s ON s.id = m.session_id
//        WHERE m.is_from_me = 0
//        AND m.chat_jid NOT LIKE '%@g.us'
//        ${sessionFilter}
//        ORDER BY m.timestamp DESC
//        LIMIT 20`,
//       [...sessionParams]
//     );

//     // ── 10. Data Tren Pesan (Line Chart) ──────────────────────────────
//     let groupBy = "DATE_FORMAT(m.timestamp, '%H:00')";
//     if (period === "Minggu" || period === "Bulan") {
//       groupBy = "DATE_FORMAT(m.timestamp, '%d %b')";
//     }

//     const trendData = await query(
//       `SELECT
//           ${groupBy} AS time,
//           SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) AS masuk,
//           SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) AS keluar
//        FROM wa_messages m
//        WHERE m.chat_jid NOT LIKE '%@g.us'
//        AND ${periodFilter}
//        ${sessionFilter}
//        GROUP BY time
//        ORDER BY m.timestamp ASC`,
//       [...sessionParams]
//     );

//     // ── 11. Data Lead per Device (Bar Chart) ──────────────────────────
//     const devicePerformance = await query(
//       `SELECT
//           s.name,
//           COUNT(DISTINCT m.chat_jid) AS lead_count
//        FROM wa_sessions s
//        LEFT JOIN wa_messages m ON s.id = m.session_id
//           AND m.is_from_me = 0
//           AND m.chat_jid NOT LIKE '%@g.us'
//           AND ${periodFilter.replace(/m\./g, 'm.')}
//        GROUP BY s.id, s.name`,
//       []
//     );

//     // ── 12. Kirim Respon ke Frontend ───────────────────────────────────
//     res.json({
//       success: true,
//       stats: {
//         pesanMasukAllTime: rowPesanMasukAllTime?.count ?? 0, // Untuk angka besar di Live Stream
//         pesanMasukToday: rowPesanMasukPeriod?.count ?? 0,   // Untuk Stat Card periode
//         pesanKeluar: rowPesanKeluar?.count ?? 0,
//         totalDevice,
//         deviceConnected,
//         leadMasuk: rowLeadMasuk?.count ?? 0,
//         leadAktif: rowLeadAktif?.count ?? 0,
//         slowResponse: rowSlowResponse?.count ?? 0,
//         unanswered: rowUnanswered?.count ?? 0,
//       },
//       devices: allSessions,
//       messages: liveMessages,
//       chartData: trendData,
//       deviceStats: devicePerformance,
//     });
//   } catch (err) {
//     console.error("Error /stats/dashboard:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });

// analisis AI

router.post("/ai/analyze-dashboard", async (req, res) => {
  try {
    const { stats } = req.body;

    if (!stats) {
      return res.status(400).json({
        success: false,
        message: "Data statistik tidak ditemukan",
      });
    }

    // Menggunakan model sesuai dokumentasi terbaru (Gemini 3 atau 2.5 Flash)
    // Pastikan menggunakan "gemini-3-flash-preview" atau "gemini-2.5-flash"
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `
        Anda adalah pakar strategi WhatsApp Marketing.
        Analisis data performa hari ini:
        - Pesan Masuk: ${stats.pesanMasukToday || 0}
        - Pesan Terkirim: ${stats.pesanKeluar || 0}
        - Leads Baru: ${stats.leadMasuk || 0}
        - Leads Aktif: ${stats.leadAktif || 0}
        - Slow Response: ${stats.slowResponse || 0}
        - Belum Terjawab: ${stats.unanswered || 0}

        Berikan 3 poin analisis singkat:
        1. Kesimpulan performa.
        2. Masalah utama (fokus ke Slow Response).
        3. Strategi closing.
      `,
    });

    // Sesuai dokumentasi baru: langsung gunakan .text (bukan fungsi)
    res.json({
      success: true,
      analysis: response.text,
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Memberikan info error yang lebih jelas untuk debugging
    res.status(500).json({
      success: false,
      message: "Gagal memproses AI",
      error: error.message,
    });
  }
});

router.get("/stats/dashboard", authenticateToken, async (req, res) => {
  try {
    const { period = "Hari ini", sessionId, startDate, endDate } = req.query;
    const userId = req.user.id;
    const roleType = req.user.role_type.toLowerCase().trim();

    // 1. Ambil list device yang diizinkan (Optimasi: Langsung ambil ID saja)
    let allowedSessions = [];
    if (roleType === "system" || roleType === "manager") {
      allowedSessions = await query(
        "SELECT id, name, status FROM wa_sessions ORDER BY name ASC",
      );
    } else {
      allowedSessions = await query(
        `SELECT s.id, s.name, s.status FROM wa_sessions s 
         INNER JOIN wa_user_sessions us ON s.id = us.session_id 
         WHERE us.user_id = ? ORDER BY s.name ASC`,
        [userId],
      );
    }

    const allowedIds = allowedSessions.map((s) => s.id);
    if (allowedIds.length === 0)
      return res.json({
        success: true,
        stats: {
          /* data kosong */
        },
        devices: [],
      });

    // 2. Filter Device Security
    let finalSessionIds =
      sessionId && sessionId !== "all" && allowedIds.includes(sessionId)
        ? [sessionId]
        : allowedIds;

    const placeholders = finalSessionIds.map(() => "?").join(",");
    const sessionFilter = `AND m.session_id IN (${placeholders})`;

    // 3. Bangun Filter Periode
    const periodFilter = buildPeriodFilter(
      period,
      "m.timestamp",
      startDate,
      endDate,
    );

    // --- OPTIMASI KUNCI: Hitung Batas Waktu Terkecil Sekali Saja ---
    // Ini mencegah database melakukan scan ulang jutaan baris di dalam subquery
    // --- OPTIMASI UTAMA: Pre-calculate Batas Waktu Periode ---
    // Tambahkan kata "AND" sebelum ${periodFilter} agar syntax SQL benar
    const [minTimeRow] = await query(
      `SELECT MIN(timestamp) as min_t FROM wa_messages m WHERE 1=1 AND ${periodFilter}`,
      [],
    );
    const minPeriodTimestamp = minTimeRow?.min_t || "2000-01-01 00:00:00";

    // --- EXECUTE QUERIES ---
    const [
      [rowPesanMasukAllTime],
      [rowPesanMasukPeriod],
      [rowPesanKeluar],
      [rowLeadMasuk],
      [rowLeadAktif],
      [rowSlowResponse],
      [rowUnanswered],
      liveMessages,
      trendData,
      devicePerformance,
    ] = await Promise.all([
      // 1. Total All Time
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 2. Masuk Periode
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 3. Keluar Periode
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 1 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 5. Lead Masuk (Akurat & Cepat)
      // Definisi Lead: Chat pertama kali muncul di sistem dalam rentang waktu terpilih
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
         FROM wa_messages m
         WHERE m.is_from_me = 0 
         AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.chat_jid NOT LIKE '%@newsletter'
         AND ${periodFilter} 
         ${sessionFilter}
         AND NOT EXISTS (
           SELECT 1 FROM wa_messages older 
           WHERE older.chat_jid = m.chat_jid 
           AND older.timestamp < ?
         )`,
        [...finalSessionIds, minPeriodTimestamp], // Menggunakan parameter statis
      ),

      // 6. Lead Aktif (30 Menit Terakhir)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 7. Slow Response (> 10 Menit belum dibalas)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count FROM wa_messages m 
         WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.timestamp <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) 
         AND ${periodFilter} ${sessionFilter} 
         AND NOT EXISTS (SELECT 1 FROM wa_messages r WHERE r.chat_jid = m.chat_jid AND r.is_from_me = 1 AND r.timestamp > m.timestamp)`,
        [...finalSessionIds],
      ),

      // 8. Tak Terjawab (> 24 Jam)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count FROM wa_messages m 
         WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.timestamp <= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
         AND ${periodFilter} ${sessionFilter} 
         AND NOT EXISTS (SELECT 1 FROM wa_messages r WHERE r.chat_jid = m.chat_jid AND r.is_from_me = 1 AND r.timestamp > m.timestamp)`,
        [...finalSessionIds],
      ),

      // 9. Live Feed
      query(
        `SELECT m.id, COALESCE(ct.push_name, m.chat_jid) AS sender, m.content AS message_text, s.name AS received_via, m.timestamp AS received_at 
         FROM wa_messages m 
         LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid 
         LEFT JOIN wa_sessions s ON s.id = m.session_id 
         WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' ${sessionFilter} 
         ORDER BY m.timestamp DESC LIMIT 15`,
        [...finalSessionIds],
      ),

      // 10. Trend Data
      query(
        `SELECT 
          ${["Minggu", "Bulan", "Custom"].includes(period) ? "DATE(m.timestamp)" : "DATE_FORMAT(m.timestamp, '%H:00')"} AS time, 
          SUM(m.is_from_me = 0) AS masuk, 
          SUM(m.is_from_me = 1) AS keluar 
         FROM wa_messages m 
         WHERE m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter} 
         GROUP BY time ORDER BY time ASC`,
        [...finalSessionIds],
      ),

      // 11. Performa Device (Lead Masuk per Device)
      query(
        `SELECT s.name, 
         (SELECT COUNT(DISTINCT m2.chat_jid) 
          FROM wa_messages m2 
          WHERE m2.session_id = s.id AND m2.is_from_me = 0 
          AND m2.chat_jid NOT LIKE '%@g.us' 
          AND ${periodFilter.replace(/m\./g, "m2.")}
          AND NOT EXISTS (SELECT 1 FROM wa_messages older WHERE older.chat_jid = m2.chat_jid AND older.timestamp < ?)
         ) AS lead_count
         FROM wa_sessions s 
         WHERE s.id IN (${placeholders})`,
        [minPeriodTimestamp, ...finalSessionIds],
      ),
    ]);

    res.json({
      success: true,
      stats: {
        pesanMasukAllTime: rowPesanMasukAllTime?.count || 0,
        pesanMasukToday: rowPesanMasukPeriod?.count || 0,
        pesanKeluar: rowPesanKeluar?.count || 0,
        totalDevice: allowedSessions.length,
        deviceConnected: allowedSessions.filter((s) => s.status === "connected")
          .length,
        leadMasuk: rowLeadMasuk?.count || 0,
        leadAktif: rowLeadAktif?.count || 0,
        slowResponse: rowSlowResponse?.count || 0,
        unanswered: rowUnanswered?.count || 0,
      },
      devices: allowedSessions,
      messages: liveMessages,
      chartData: trendData,
      deviceStats: devicePerformance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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
// ===============================================
// GLOBAL INBOX - MENGAMBIL PESAN TERAKHIR (FIXED)
// ===============================================

// ===============================================
// GET: LEADS ONLY - PESAN DARI NOMOR NON-KONTAK (LOGIKA DIPERBAIKI)
// ===============================================
// ===============================================
// GET: LEADS ONLY - HANYA PESAN MASUK TERBARU
// ===============================================
// GET: /chats/leads-only
router.get("/chats/leads-only", async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.id,
        m.chat_jid AS remoteJid,
        m.content,
        m.timestamp AS updatedAt,
        COALESCE(ct.push_name, JSON_UNQUOTE(JSON_EXTRACT(m.raw_data, '$.pushName')), 'Unknown') AS pushName,
        -- LOGIKA TRACKING SUMBER --
        (
          SELECT ls.source_name 
          FROM wa_lead_sources ls 
          WHERE m.content LIKE CONCAT('%', ls.keyword, '%') 
          LIMIT 1
        ) AS lead_source,
        (
          SELECT ls.color_code 
          FROM wa_lead_sources ls 
          WHERE m.content LIKE CONCAT('%', ls.keyword, '%') 
          LIMIT 1
        ) AS source_color
      FROM wa_messages m
      INNER JOIN (
        -- Ambil pesan pertama dari orang tersebut (untuk deteksi sumber asal)
        SELECT MIN(id) as first_msg_id, chat_jid
        FROM wa_messages
        WHERE is_from_me = 0
        GROUP BY chat_jid
      ) first_msg ON m.chat_jid = first_msg.chat_jid
      INNER JOIN (
        -- Ambil pesan terakhir untuk ditampilkan di list
        SELECT MAX(id) as last_id
        FROM wa_messages
        GROUP BY chat_jid
      ) latest ON m.id = latest.last_id
      LEFT JOIN wa_contacts ct ON ct.jid = m.chat_jid
      WHERE (ct.name IS NULL OR ct.name = '')
        AND m.chat_jid NOT LIKE '%@g.us'
      ORDER BY m.timestamp DESC
    `;

    const leads = await query(sql);
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
        -- Mengambil ID pesan terakhir, abaikan Grup dan Saluran
        SELECT MAX(id) as last_id
        FROM wa_messages
        WHERE chat_jid NOT LIKE '%@g.us' 
          AND chat_jid NOT LIKE '%@newsletter'
          AND chat_jid NOT LIKE 'status@broadcast'
        GROUP BY chat_jid, session_id
      ) latest ON m.id = latest.last_id
      LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid
      LEFT JOIN wa_chats ch ON ch.session_id = m.session_id AND ch.jid = m.chat_jid
      LEFT JOIN wa_sessions s ON s.id = m.session_id
      WHERE (ch.is_group = 0 OR ch.is_group IS NULL)
        AND m.chat_jid NOT LIKE '%@newsletter'
      ORDER BY m.timestamp DESC
      LIMIT 100
    `;

    const messages = await query(sql);
    console.log("Total pesan global (tanpa saluran):", messages.length);

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Query Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================================
// GET: DAFTAR CHAT PER SESI (FIXED)
// ===============================================
router.get("/sessions/:sessionId/chats", async (req, res) => {
  const { sessionId } = req.params;
  const { search = "", page = "1", limit = "50" } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let sql = `
      SELECT 
        c.jid,
        c.session_id,
        c.name AS chat_name,
        c.last_message_time,
        c.last_message,
        c.unread_count,
        c.pinned,
        c.archived,
        c.muted,
        c.is_group,
        COALESCE(ct.name, ct.push_name, c.name, c.jid) AS display_name,
        ct.profile_pic_url,
        COALESCE(
          CONCAT(
            '[',
            GROUP_CONCAT(
              CASE 
                WHEN l.id IS NOT NULL THEN 
                  JSON_OBJECT(
                    'id', l.id,
                    'name', l.name,
                    'color', l.color,
                    'icon', l.icon,
                    'description', l.description,
                    'sort_order', l.sort_order
                  )
                ELSE NULL
              END
              SEPARATOR ','
            ),
            ']'
          ),
          '[]'
        ) AS labels
      FROM wa_chats c
      LEFT JOIN wa_contacts ct 
        ON ct.session_id = c.session_id 
        AND ct.jid = c.jid
      LEFT JOIN wa_chat_labels cl 
        ON cl.session_id = c.session_id 
        AND cl.chat_jid = c.jid
      LEFT JOIN wa_labels l 
        ON l.id = cl.label_id 
        AND l.session_id = c.session_id
      WHERE c.session_id = ? 
        AND c.is_group = 0 
        AND c.jid NOT LIKE '%@newsletter' -- FILTER SALURAN
        AND c.jid NOT LIKE 'status@broadcast' -- FILTER STATUS
      GROUP BY c.jid, c.session_id
      ORDER BY c.pinned DESC, c.last_message_time DESC
      LIMIT ? OFFSET ?
    `;

    let params = [sessionId, limitNum, offset];

    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      sql = sql.replace(
        "WHERE c.session_id = ?",
        `WHERE c.session_id = ?
         AND (
           COALESCE(ct.name, ct.push_name, c.name, c.jid) LIKE ?
           OR c.jid LIKE ?
         )`,
      );
      params.splice(1, 0, searchTerm, searchTerm);
    }

    const chats = await query(sql, params);

    const parsedChats = chats.map((chat) => {
      let labels = [];
      try {
        if (chat.labels && chat.labels !== "[]") {
          labels = JSON.parse(chat.labels);
        }
      } catch (e) {
        console.warn("Gagal parse labels:", chat.jid, e);
      }
      return {
        ...chat,
        labels,
        unread_count: Number(chat.unread_count || 0),
        pinned: Number(chat.pinned || 0),
        archived: Number(chat.archived || 0),
        muted: Number(chat.muted || 0),
        is_group: Boolean(chat.is_group || 0),
      };
    });

    // Hitung total data untuk pagination (FIXED FILTER)
    let countSql = `
      SELECT COUNT(DISTINCT c.jid) as total 
      FROM wa_chats c
      LEFT JOIN wa_contacts ct ON ct.session_id = c.session_id AND ct.jid = c.jid
      WHERE c.session_id = ? 
        AND c.is_group = 0 
        AND c.jid NOT LIKE '%@newsletter'
        AND c.jid NOT LIKE 'status@broadcast'
    `;
    let countParams = [sessionId];

    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      countSql += `
        AND (
          COALESCE(ct.name, ct.push_name, c.name, c.jid) LIKE ?
          OR c.jid LIKE ?
        )
      `;
      countParams.push(searchTerm, searchTerm);
    }

    const [totalRow] = await query(countSql, countParams);

    res.json({
      success: true,
      data: parsedChats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRow?.total || 0,
        totalPages: Math.ceil((totalRow?.total || 0) / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching chats:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat daftar chat" });
  }
});

// ===============================================
// GET: PESAN DALAM SATU CHAT
// ===============================================
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

// ===============================================
// PUT: MARK CHAT AS READ
// ===============================================
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
// 1. Fungsi pembantu untuk jeda (letakkan di luar route)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    // --- STRATEGI ANTI-BLOKIR ---

    // 2. Berikan delay acak (Misal: antara 2 sampai 5 detik)
    // Tujuannya agar pola pengiriman tidak kaku/robotik
    const randomDelay = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
    console.log(
      `[WhatsApp] Menunggu ${randomDelay}ms sebelum mengirim ke ${to}...`,
    );
    await delay(randomDelay);

    // 3. (Opsional) Kirim status 'composing' (mengetik)
    // Anda perlu akses ke object 'sock' (socket) di dalam sendTextMessage
    // atau panggil fungsi update kehadiran jika library Anda mendukungnya.
    // Contoh jika menggunakan instance langsung:
    // await socket.sendPresenceUpdate('composing', to);
    // await delay(2000); // Simulasi mengetik selama 2 detik

    // 4. Kirim pesan utama
    const sent = await sendTextMessage(sessionId, to, text, quotedMsgId);

    res.json({
      success: true,
      data: sent,
      message: "Pesan berhasil dikirim dengan delay",
      delayApplied: `${randomDelay}ms`,
    });
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
      c.id,
      c.session_id,
      c.jid,
      c.name,
      c.is_group,
      c.unread_count,
      c.last_message,
      c.last_message_time,
      c.last_message_from,
      c.pinned,
      c.archived,
      c.muted,
      c.created_at,
      g.subject        AS group_subject,
      g.description    AS group_description,
      g.owner_jid      AS group_owner,
      g.participant_count,
      g.profile_pic_url,
      COALESCE(g.subject, c.name) AS display_name
    FROM wa_chats c
    LEFT JOIN wa_groups g 
           ON g.session_id = c.session_id AND g.jid = c.jid
    WHERE c.session_id = ? 
      AND c.is_group = 1
  `;
  const params = [sessionId];

  if (search) {
    sql += ` AND (
      c.name LIKE ? OR 
      c.jid  LIKE ? OR 
      g.subject LIKE ?
    )`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY c.pinned DESC, c.last_message_time DESC";

  try {
    const groups = await query(sql, params);
    res.json({ success: true, data: groups });
  } catch (err) {
    console.error("Error fetch groups:", err.message);
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
      [sessionId],
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
    const {
      name,
      color = "#00a884",
      icon = "tag",
      description = "",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama label wajib diisi",
      });
    }

    // Check if label already exists
    const existing = await queryOne(
      "SELECT id FROM wa_labels WHERE session_id = ? AND name = ?",
      [sessionId, name.trim()],
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Label dengan nama ini sudah ada",
      });
    }

    const result = await query(
      `INSERT INTO wa_labels (session_id, name, color, icon, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, name.trim(), color, icon, description],
    );

    const newLabel = await queryOne("SELECT * FROM wa_labels WHERE id = ?", [
      result.insertId,
    ]);

    res.json({
      success: true,
      data: newLabel,
      message: "Label berhasil dibuat",
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
        message: "Tidak ada data yang diupdate",
      });
    }

    params.push(sessionId, labelId);

    await query(
      `UPDATE wa_labels SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE session_id = ? AND id = ?`,
      params,
    );

    const updated = await queryOne(
      "SELECT * FROM wa_labels WHERE session_id = ? AND id = ?",
      [sessionId, labelId],
    );

    res.json({
      success: true,
      data: updated,
      message: "Label berhasil diupdate",
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
    await query("DELETE FROM wa_labels WHERE session_id = ? AND id = ?", [
      sessionId,
      labelId,
    ]);

    res.json({
      success: true,
      message: "Label berhasil dihapus",
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
      [sessionId, decodedJid],
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
        message: "Label ID wajib diisi",
      });
    }

    // Check if label exists
    const label = await queryOne(
      "SELECT id FROM wa_labels WHERE session_id = ? AND id = ?",
      [sessionId, labelId],
    );

    if (!label) {
      return res.status(404).json({
        success: false,
        message: "Label tidak ditemukan",
      });
    }

    // Check if already assigned
    const existing = await queryOne(
      "SELECT id FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND label_id = ?",
      [sessionId, decodedJid, labelId],
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Label sudah ditambahkan ke chat ini",
      });
    }

    await query(
      "INSERT INTO wa_chat_labels (session_id, chat_jid, label_id) VALUES (?, ?, ?)",
      [sessionId, decodedJid, labelId],
    );

    res.json({
      success: true,
      message: "Label berhasil ditambahkan ke chat",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: Remove label dari chat
router.delete(
  "/sessions/:sessionId/chats/:chatJid/labels/:labelId",
  async (req, res) => {
    try {
      const { sessionId, chatJid, labelId } = req.params;
      const decodedJid = decodeURIComponent(chatJid);

      await query(
        "DELETE FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND label_id = ?",
        [sessionId, decodedJid, labelId],
      );

      res.json({
        success: true,
        message: "Label berhasil dihapus dari chat",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

export default router;
