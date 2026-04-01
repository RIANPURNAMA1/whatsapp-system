// routes.js - Semua API Routes
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { log } from "console";
import { query, queryOne } from "./db.js";
import {
  createSession,
  sendTextMessage,
  sendMediaMessage,
  markAsRead,
  deleteMessage,
  logoutSession,
  isSessionConnected,
  getSessionInfo,
  sessions,
} from "./whatsapp.js";
import { GoogleGenAI } from "@google/genai";

// Di bagian atas file
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import path from "path"; // Ini yang kurang
const pdf = require("pdf-parse-fork"); // Gunakan fork-nya

// Konfigurasi Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const router = express.Router();


import { fileURLToPath } from "url";
// Konfigurasi untuk mendapatkan path di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1. Tentukan subfolder secara dinamis berdasarkan URL request
    // Jika URL mengandung 'upload-asset', arahkan ke folder 'media'
    const subFolder = req.originalUrl.includes('/ai-settings/upload-asset') 
      ? "media" 
      : "rules";

    // 2. Susun path absolutnya: /uploads/media atau /uploads/rules
    const uploadDir = path.join(__dirname, "uploads", subFolder);
    
    // 3. Pastikan folder tujuan ada, jika tidak, buat secara otomatis
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gunakan timestamp agar nama file tidak bentrok
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ... Lanjutkan ke Route API Anda ...
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
      ORDER BY u.id DESC  -- GANTI created_at MENJADI id
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

    if (roleType === "system" || roleType === "manager") {
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
// LINK ROTATOR ROUTES
// ===============================================

// GET: Ambil semua link rotator milik user (atau semua jika system)
router.get("/rotators", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type.toLowerCase().trim();

    let sql = "";
    let params = [];

    if (roleType === "system" || roleType === "manager") {
      // System/Manager bisa melihat semua rotator
      sql = "SELECT * FROM link_rotators ORDER BY id DESC";
    } else {
      // User biasa hanya melihat miliknya sendiri
      sql = "SELECT * FROM link_rotators WHERE user_id = ? ORDER BY id DESC";
      params = [userId];
    }

    const data = await query(sql, params);

    // Tambahkan domain ke short_code agar menjadi URL lengkap di frontend
    const domain =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const formattedData = data.map((item) => ({
      ...item,
      url: `${domain}/r/${item.short_code}`,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("GET Rotators Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ==========================================
// 1. POST: Tambah Rotator Baru
// ==========================================
router.post("/rotators", authenticateToken, async (req, res) => {
  // Ambil data sesuai payload Frontend (snake_case)
  const { name, short_code, type, target_type, wa_numbers, message } = req.body;
  const userId = req.user.id;

  // Validasi wajib isi
  if (!name || !short_code || !wa_numbers) {
    return res.status(400).json({
      success: false,
      message: "Nama, Slug, dan Nomor WA wajib diisi",
    });
  }

  try {
    // Bersihkan slug agar URL-friendly
    const cleanSlug = short_code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // PENTING: Gunakan 'short_code' (snake_case) di query WHERE
    const existing = await queryOne(
      "SELECT id FROM link_rotators WHERE short_code = ?",
      [cleanSlug]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug/Shortcode sudah digunakan, coba yang lain.",
      });
    }

    const sql = `
      INSERT INTO link_rotators 
      (user_id, name, short_code, type, target_type, wa_numbers, message, clicks, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())
    `;

    const result = await query(sql, [
      userId,
      name,
      cleanSlug,
      type || "direct",
      target_type || "single",
      wa_numbers, // Pastikan ini string JSON dari Frontend
      message || "",
    ]);

    res.json({
      success: true,
      message: "Link Rotator berhasil dibuat",
      id: result.insertId,
    });
  } catch (error) {
    console.error("POST Rotator Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// PUT: Update Rotator (Edit Data)
router.put("/rotators/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // PERBAIKAN: Gunakan snake_case agar sama dengan payload dari frontend
  const { name, short_code, type, target_type, wa_numbers, message } = req.body;

  const userId = req.user.id;
  const roleType = req.user.role_type.toLowerCase().trim();

  // 1. Validasi Input Dasar - Sekarang menggunakan nama variabel yang benar
  if (!name || !short_code || !wa_numbers) {
    return res.status(400).json({
      success: false,
      message: "Nama, Slug, dan Nomor WA wajib diisi",
    });
  }

  try {
    // 2. Cek Kepemilikan
    const existingData = await queryOne(
      "SELECT user_id, short_code FROM link_rotators WHERE id = ?",
      [id]
    );

    if (!existingData) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    if (roleType !== "system" && existingData.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses mengedit link ini",
      });
    }

    // 3. Cek Duplikasi Slug
    const newSlug = short_code.trim().toLowerCase().replace(/\s+/g, "-");
    if (newSlug !== existingData.short_code) {
      const slugExists = await queryOne(
        "SELECT id FROM link_rotators WHERE short_code = ? AND id != ?",
        [newSlug, id]
      );
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: "Slug sudah digunakan oleh link lain.",
        });
      }
    }

    // 4. Proses Update ke Database
    const sql = `
      UPDATE link_rotators 
      SET 
        name = ?, 
        short_code = ?, 
        type = ?, 
        target_type = ?, 
        wa_numbers = ?, 
        message = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await query(sql, [
      name,
      newSlug,
      type || "direct",
      target_type || "single",
      wa_numbers, // Data JSON dari frontend
      message || "",
      id,
    ]);

    res.json({
      success: true,
      message: "Link Rotator berhasil diperbarui",
    });
  } catch (error) {
    console.error("PUT Rotator Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui database: " + error.message,
    });
  }
});

// DELETE: Hapus Rotator
router.delete("/rotators/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const roleType = req.user.role_type.toLowerCase().trim();

  try {
    // Proteksi: Hanya pemilik atau admin system yang boleh hapus
    if (roleType !== "system") {
      const owner = await queryOne(
        "SELECT user_id FROM link_rotators WHERE id = ?",
        [id],
      );
      if (!owner || owner.user_id !== userId) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Anda tidak memiliki akses menghapus link ini",
          });
      }
    }

    await query("DELETE FROM link_rotators WHERE id = ?", [id]);
    res.json({ success: true, message: "Link berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===============================================
// TRACKED LINKS - Lacak klik URL eksternal
// ===============================================

// GET: Ambil semua tracked links
router.get("/tracked-links", authenticateToken, async (req, res) => {
  try {
    const data = await query(`
      SELECT 
        id, name, original_url, short_code, clicks, clicks_today, clicks_week, clicks_month, created_at
      FROM tracked_links 
      ORDER BY id DESC
    `);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Tambah tracked link baru
router.post("/tracked-links", authenticateToken, async (req, res) => {
  const { name, original_url } = req.body;
  
  if (!name || !original_url) {
    return res.status(400).json({ 
      success: false, 
      message: "Nama dan URL harus diisi" 
    });
  }

  try {
    // Validasi URL
    try {
      new URL(original_url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        message: "Format URL tidak valid" 
      });
    }

    const generateShortCode = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let shortCode = generateShortCode();
    let existing = await queryOne("SELECT id FROM tracked_links WHERE short_code = ?", [shortCode]);
    while (existing) {
      shortCode = generateShortCode();
      existing = await queryOne("SELECT id FROM tracked_links WHERE short_code = ?", [shortCode]);
    }

    const result = await query(
      `INSERT INTO tracked_links (name, original_url, short_code, clicks, clicks_today, clicks_week, clicks_month, created_at) 
       VALUES (?, ?, ?, 0, 0, 0, 0, NOW())`,
      [name, original_url, shortCode]
    );

    const newLink = await queryOne(
      `SELECT id, name, original_url, short_code, clicks, clicks_today, clicks_week, clicks_month, created_at 
       FROM tracked_links WHERE id = ?`,
      [result.insertId]
    );

    res.json({ success: true, data: newLink, message: "Link berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE: Hapus tracked link
router.delete("/tracked-links/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    await query("DELETE FROM tracked_links WHERE id = ?", [id]);
    res.json({ success: true, message: "Link berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Update tracked link
router.put("/tracked-links/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, original_url } = req.body;
  
  try {
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (original_url) {
      try {
        new URL(original_url);
        updates.push("original_url = ?");
        values.push(original_url);
      } catch {
        return res.status(400).json({ 
          success: false, 
          message: "Format URL tidak valid" 
        });
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Tidak ada data yang diupdate" 
      });
    }
    
    values.push(id);
    await query(
      `UPDATE tracked_links SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    
    res.json({ success: true, message: "Link berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Update keyword berdasarkan platform
router.put("/keywords/:platform", authenticateToken, async (req, res) => {
  const { platform } = req.params;
  const { keyword_text } = req.body;
  try {
    await query(
      "UPDATE lead_keywords SET keyword_text = ? WHERE platform = ?",
      [keyword_text, platform],
    );
    res.json({
      success: true,
      message: `Keyword ${platform} berhasil diperbarui`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simpan atau Update Keyword
router.post("/keywords/save", authenticateToken, async (req, res) => {
  const { platform, keyword_text, session_id } = req.body; // Ambil session_id dari request

  if (!platform || !keyword_text || !session_id) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Platform, Keyword, dan Perangkat harus diisi",
      });
  }

  try {
    const sql = `
      INSERT INTO lead_keywords (platform, session_id, keyword_text) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        keyword_text = VALUES(keyword_text),
        session_id = VALUES(session_id)
    `;

    await query(sql, [platform.toLowerCase(), session_id, keyword_text]);

    res.json({
      success: true,
      message: `Keyword berhasil disimpan untuk perangkat tersebut!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ambil semua keyword untuk ditampilkan di tabel
router.get("/keywords", authenticateToken, async (req, res) => {
  try {
    const data = await query(`
      SELECT k.*, s.name as session_name 
      FROM lead_keywords k
      LEFT JOIN wa_sessions s ON k.session_id = s.id
      ORDER BY k.platform ASC
    `);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Pastikan ID diterima sebagai parameter :id
router.delete("/keywords/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Lakukan penghapusan di database
    const result = await query("DELETE FROM lead_keywords WHERE id = ?", [id]);

    // Cek apakah ada baris yang terhapus
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Keyword tidak ditemukan atau sudah dihapus.",
      });
    }

    res.json({ success: true, message: "Keyword berhasil dihapus" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================================
// STATS ROUTES - DASHBOARD UTAMA
// ===============================================

// GET: Semua label lintas session untuk dashboard
router.get("/labels/all", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    // Sesuaikan dengan cara kamu verifikasi user
    const userId = req.user?.id; // atau dari middleware auth kamu

    const labels = await query(
      `SELECT l.*, 
              COUNT(DISTINCT cl.chat_jid) as chat_count,
              l.session_id
       FROM wa_labels l
       LEFT JOIN wa_chat_labels cl ON cl.wa_label_id = l.wa_label_id AND cl.session_id = l.session_id
       LEFT JOIN wa_sessions ws ON ws.session_id = l.session_id
       WHERE ws.user_id = ?
       GROUP BY l.session_id, l.wa_label_id
       ORDER BY chat_count DESC, l.name ASC`,
      [userId],
    );
    res.json({ success: true, data: labels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/chats/leads-only", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type.toLowerCase().trim();
    const { sessionId, startDate, endDate } = req.query;

    const dbKeywords = await query(
      "SELECT TRIM(platform) as platform, TRIM(keyword_text) as keyword_text, session_id FROM lead_keywords"
    );

    if (dbKeywords.length === 0) return res.json({ success: true, data: [] });

    let allowedSessions = (roleType === "system" || roleType === "manager")
      ? await query("SELECT id FROM wa_sessions")
      : await query("SELECT session_id as id FROM wa_user_sessions WHERE user_id = ?", [userId]);

    const allowedIds = allowedSessions.map((s) => s.id);
    if (allowedIds.length === 0) return res.json({ success: true, data: [] });

    let finalSessionIds = (sessionId && sessionId !== "all" && allowedIds.includes(sessionId))
      ? [sessionId]
      : allowedIds;

    const colors = { tiktok: '#EE1D52', instagram: '#E1306C', facebook: '#1877F2', whatsapp: '#25D366' };

    let sourceCase = "CASE ";
    let colorCase = "CASE ";
    let sourceParams = [];
    let colorParams = [];
    let keywordFilterConditions = [];
    let keywordFilterParams = [];

    dbKeywords.forEach(kw => {
      const pattern = `%${kw.keyword_text.toLowerCase().trim()}%`;
      const sId = kw.session_id;
      const platformName = kw.platform.toLowerCase().trim();
      const platformColor = colors[platformName] || '#8696A0';

      const condition = `WHEN LOWER(m.content) LIKE ? AND TRIM(m.session_id) = TRIM(?) `;

      sourceCase += `${condition} THEN ? `;
      sourceParams.push(pattern, sId, platformName);

      colorCase += `${condition} THEN ? `;
      colorParams.push(pattern, sId, platformColor);

      keywordFilterConditions.push(`(LOWER(content) LIKE ? AND TRIM(session_id) = TRIM(?))`);
      keywordFilterParams.push(pattern, sId);
    });

    sourceCase += "ELSE 'Organik' END";
    colorCase += "ELSE '#8696A0' END";

    const keywordWhereClause = `AND (${keywordFilterConditions.join(" OR ")})`;
    const placeholders = finalSessionIds.map(() => "?").join(",");
    let dateFilter = (startDate && endDate) ? `AND timestamp BETWEEN ? AND ?` : "";

    // Perbaikan: Tambahkan GROUP BY m.id di bagian paling luar untuk menyatukan join kontak yang ganda
    const sql = `
      SELECT 
        m.id, 
        m.chat_jid AS remoteJid, 
        m.content, 
        m.timestamp AS updatedAt,
        m.session_id,
        COALESCE(MAX(ct.push_name), MAX(ct.name), 'Unknown') AS pushName,
        ${sourceCase} AS lead_source,
        ${colorCase} AS source_color
      FROM wa_messages m
      INNER JOIN (
        SELECT MAX(id) as max_id
        FROM wa_messages
        WHERE is_from_me = 0 
          AND chat_jid NOT LIKE '%@g.us'
          AND session_id IN (${placeholders})
          ${dateFilter}
          ${keywordWhereClause}
        GROUP BY chat_jid
      ) latest ON m.id = latest.max_id
      LEFT JOIN wa_contacts ct ON ct.jid = m.chat_jid
      GROUP BY m.id
      ORDER BY m.timestamp DESC
      LIMIT 100
    `;

    const finalParams = [
      ...sourceParams,
      ...colorParams,
      ...finalSessionIds,
      ...(startDate && endDate ? [startDate, endDate] : []),
      ...keywordFilterParams
    ];

    const leads = await query(sql, finalParams);

    res.json({
      success: true,
      data: leads,
      platforms: [...new Set(dbKeywords.map(k => k.platform.toLowerCase().trim()))]
    });

  } catch (err) {
    console.error("Leads Filter Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get("/social/media", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, sessionId } = req.query;
    const userId = req.user.id;
    const roleType = req.user.role_type?.toLowerCase().trim();

    // 1. Ambil list device yang diizinkan (Security: Role-Based Access)
    let allowedSessions = [];
    if (roleType === "system" || roleType === "manager") {
      allowedSessions = await query(
        "SELECT id FROM wa_sessions"
      );
    } else {
      allowedSessions = await query(
        `SELECT s.id FROM wa_sessions s 
         INNER JOIN wa_user_sessions us ON s.id = us.session_id 
         WHERE us.user_id = ?`,
        [userId]
      );
    }

    const allowedIds = allowedSessions.map((s) => s.id);
    if (allowedIds.length === 0) {
      return res.json({ success: true, data: [], platforms: [] });
    }

    // 2. Filter Device Security (Hanya proses ID yang memang diizinkan)
    let finalSessionIds = 
      sessionId && sessionId !== "all" && allowedIds.includes(sessionId)
        ? [sessionId]
        : allowedIds;

    // 3. Ambil Keywords hanya untuk Session yang diizinkan
    const keywords = await query(
      "SELECT platform, keyword_text, session_id FROM lead_keywords WHERE session_id IN (?)",
      [finalSessionIds]
    );

    if (keywords.length === 0 && finalSessionIds.length > 0) {
       // Tetap lanjut untuk hitung closing, tapi platforms akan kosong
    }

    // 4. Siapkan filter tanggal
    let paramsMessages = [finalSessionIds];
    let paramsClosing = [finalSessionIds];
    let dateFilterMsg = "";
    let dateFilterClosing = "";

    if (startDate && endDate) {
      dateFilterMsg = "AND m.timestamp BETWEEN ? AND ? ";
      paramsMessages.push(startDate, endDate);

      dateFilterClosing = "AND cl.assigned_at BETWEEN ? AND ? ";
      paramsClosing.push(startDate, endDate);
    }

    // 5. Query Utama (Messages & Labels)
    const sqlMessages = `
      SELECT m.session_id, m.chat_jid, LOWER(m.content) as content
      FROM wa_messages m
      WHERE m.session_id IN (?) 
        AND m.is_from_me = 0 
        AND m.chat_jid NOT LIKE '%@g.us'
        ${dateFilterMsg}
    `;

    const sqlClosing = `
      SELECT cl.session_id, COUNT(DISTINCT cl.chat_jid) as closing_count
      FROM wa_chat_labels cl
      JOIN wa_labels l ON cl.wa_label_id = l.wa_label_id
      WHERE cl.session_id IN (?)
        AND LOWER(l.name) LIKE '%closing%'
        ${dateFilterClosing}
      GROUP BY cl.session_id
    `;

    const [messages, closingData] = await Promise.all([
      query(sqlMessages, paramsMessages),
      query(sqlClosing, paramsClosing)
    ]);

    // 6. Mapping & Kalkulasi (Sama dengan logic sebelumnya)
    const closingMap = {};
    closingData.forEach(c => {
      closingMap[c.session_id] = parseInt(c.closing_count);
    });

    const stats = {};
    const uniqueSenders = {};

    messages.forEach((msg) => {
      const sId = msg.session_id;
      const sender = msg.chat_jid;

      if (!stats[sId]) {
        stats[sId] = { 
          session_id: sId, 
          totalPesanMasuk: 0,
          totalLeads: 0,
          totalClosing: closingMap[sId] || 0 
        };
        uniqueSenders[sId] = { all_leads: new Set() };
        
        keywords.filter(k => k.session_id === sId).forEach((k) => {
          const pKey = `leads_${k.platform.toLowerCase()}`;
          stats[sId][pKey] = 0;
          uniqueSenders[sId][pKey] = new Set();
        });
      }

      stats[sId].totalPesanMasuk++;

      const relevantKeywords = keywords.filter((k) => k.session_id === sId);
      relevantKeywords.forEach((k) => {
        const platformKey = `leads_${k.platform.toLowerCase()}`;
        const searchKeyword = k.keyword_text.toLowerCase().trim();

        if (searchKeyword && msg.content && msg.content.includes(searchKeyword)) {
          if (!uniqueSenders[sId][platformKey].has(sender)) {
            uniqueSenders[sId][platformKey].add(sender);
            stats[sId][platformKey]++;
          }
          if (!uniqueSenders[sId].all_leads.has(sender)) {
            uniqueSenders[sId].all_leads.add(sender);
            stats[sId].totalLeads++;
          }
        }
      });
    });

    // Pastikan session yang diizinkan tetap muncul di data meski stats-nya nol
    finalSessionIds.forEach(id => {
        if (!stats[id]) {
            stats[id] = {
                session_id: id,
                totalPesanMasuk: 0,
                totalLeads: 0,
                totalClosing: closingMap[id] || 0
            };
        }
    });

    res.json({
      success: true,
      data: Object.values(stats),
      platforms: [...new Set(keywords.map((k) => k.platform.toLowerCase()))],
    });

  } catch (error) {
    console.error("Error at /social/media:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/social/media/all/leads", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime, sessionId, period } = req.query;
    const userId = req.user.id;
    const roleType = req.user.role_type?.toLowerCase().trim();

    // 1. ACL & Device Filtering
    let allowedSessions = [];
    if (roleType === "system" || roleType === "manager") {
      allowedSessions = await query("SELECT id, name FROM wa_sessions ORDER BY name ASC");
    } else {
      allowedSessions = await query(
        `SELECT s.id, s.name FROM wa_sessions s 
         INNER JOIN wa_user_sessions us ON s.id = us.session_id 
         WHERE us.user_id = ? ORDER BY s.name ASC`, [userId]
      );
    }

    const allowedIds = allowedSessions.map(s => s.id);
    if (allowedIds.length === 0) return res.json({ success: true, summary: { totalLeads: 0, totalClosing: 0 }, deviceData: [] });

    let targetSessionIds = (sessionId && sessionId !== 'all' && allowedIds.includes(sessionId)) 
      ? [sessionId] 
      : allowedIds;

    const inPlaceholder = targetSessionIds.map(() => '?').join(',');

    // 2. Logika Filter Waktu
    let dateFilterMsg = "";
    let dateFilterClosing = "";
    let queryParams = [...targetSessionIds];

    if (period && period !== "Custom") {
      switch (period) {
        case "Hari ini":
          dateFilterMsg = "AND DATE(m.timestamp) = CURDATE()";
          dateFilterClosing = "AND DATE(cl.assigned_at) = CURDATE()";
          break;
        case "Kemarin":
          dateFilterMsg = "AND DATE(m.timestamp) = SUBDATE(CURDATE(), 1)";
          dateFilterClosing = "AND DATE(cl.assigned_at) = SUBDATE(CURDATE(), 1)";
          break;
        case "Minggu":
          dateFilterMsg = "AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          dateFilterClosing = "AND cl.assigned_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          break;
        case "Bulan":
          dateFilterMsg = "AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          dateFilterClosing = "AND cl.assigned_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          break;
        default:
          dateFilterMsg = "AND DATE(m.timestamp) = CURDATE()";
          dateFilterClosing = "AND DATE(cl.assigned_at) = CURDATE()";
      }
    } else if (startDate && endDate) {
      const startFull = `${startDate} ${startTime || '00:00:00'}`;
      const endFull = `${endDate} ${endTime || '23:59:59'}`;
      dateFilterMsg = "AND m.timestamp BETWEEN ? AND ?";
      dateFilterClosing = "AND cl.assigned_at BETWEEN ? AND ?";
      queryParams.push(startFull, endFull);
    } else {
      dateFilterMsg = "AND DATE(m.timestamp) = CURDATE()";
      dateFilterClosing = "AND DATE(cl.assigned_at) = CURDATE()";
    }

    // 3. Query Paralel
    // Perhatikan: query closing menggunakan targetSessionIds sendiri untuk IN (?)
    const [keywords, closingDataRaw, messages] = await Promise.all([
      query(`SELECT platform, keyword_text, session_id FROM lead_keywords WHERE session_id IN (${inPlaceholder})`, targetSessionIds),
      
      // Mengelompokkan closing per session agar bisa tampil di Bar Chart
      query(`SELECT cl.session_id, COUNT(DISTINCT cl.chat_jid) as total_closing 
             FROM wa_chat_labels cl 
             JOIN wa_labels l ON cl.wa_label_id = l.wa_label_id
             WHERE cl.session_id IN (${inPlaceholder}) 
             AND LOWER(l.name) LIKE '%closing%' ${dateFilterClosing}
             GROUP BY cl.session_id`, (startDate && endDate) ? [...targetSessionIds, queryParams[queryParams.length-2], queryParams[queryParams.length-1]] : targetSessionIds),

      query(`SELECT m.session_id, m.chat_jid, LOWER(m.content) as content
             FROM wa_messages m
             WHERE m.session_id IN (${inPlaceholder}) 
             AND m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' ${dateFilterMsg}`, queryParams)
    ]);

    // 4. Mapping Closing per Device
    const closingMap = new Map();
    closingDataRaw.forEach(c => closingMap.set(c.session_id, parseInt(c.total_closing)));

    // 5. Perhitungan Leads
    const keywordMap = new Map();
    const deviceLeadsMap = new Map();
    const platformLeadsSet = new Map();
    let totalLeadsSet = new Set();

    targetSessionIds.forEach(id => {
      deviceLeadsMap.set(id, new Set());
      keywordMap.set(id, keywords.filter(k => k.session_id === id));
    });

    messages.forEach((msg) => {
      const sId = msg.session_id;
      const sender = msg.chat_jid;
      const sessionKeywords = keywordMap.get(sId) || [];

      sessionKeywords.forEach((k) => {
        const platform = k.platform.toLowerCase().trim();
        const kw = k.keyword_text.toLowerCase().trim();

        if (msg.content && msg.content.includes(kw)) {
          if (!platformLeadsSet.has(platform)) platformLeadsSet.set(platform, new Set());
          platformLeadsSet.get(platform).add(`${sId}-${sender}`);
          totalLeadsSet.add(`${sId}-${sender}`);
          deviceLeadsMap.get(sId).add(sender);
        }
      });
    });

    const totalLeads = totalLeadsSet.size;
    const totalClosing = Array.from(closingMap.values()).reduce((a, b) => a + b, 0);

    // 6. Response JSON
    res.json({
      success: true,
      summary: {
        totalLeads,
        totalClosing,
        averageConversionRate: totalLeads > 0 ? Math.round((totalClosing / totalLeads) * 100) : 0,
        platformBreakdown: Array.from(platformLeadsSet.keys()).map(p => ({
          platform: p.toUpperCase(),
          count: platformLeadsSet.get(p).size
        }))
      },
      deviceData: allowedSessions
        .filter(s => targetSessionIds.includes(s.id))
        .map(s => ({
          name: s.name.toUpperCase(),
          lead_count: deviceLeadsMap.get(s.id)?.size || 0,
          closing_count: closingMap.get(s.id) || 0 // Data untuk bar kedua
        }))
    });

  } catch (error) {
    console.error("API Error at /social/media/all/leads:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
      // 1. Total Leads All Time (Unique Customers)
      // Menghitung berapa banyak nomor unik yang pernah chat ke kita secara keseluruhan
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
     FROM wa_messages m 
     WHERE m.is_from_me = 0 
     AND m.chat_jid NOT LIKE '%@g.us' 
     AND m.chat_jid NOT LIKE '%@newsletter'
     ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 2. Leads Masuk Periode (Unique Customers in Period)
      // Menghitung berapa banyak nomor unik yang mengirim pesan dalam periode filter
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
     FROM wa_messages m 
     WHERE m.is_from_me = 0 
     AND m.chat_jid NOT LIKE '%@g.us' 
     AND m.chat_jid NOT LIKE '%@newsletter'
     AND ${periodFilter} 
     ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 3. Leads Dibalas Periode (Unique Interacted Customers)
      // Menghitung berapa banyak nomor unik yang berhasil kita kirimi pesan (Outbound) dalam periode filter
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
     FROM wa_messages m 
     WHERE m.is_from_me = 1 
     AND m.chat_jid NOT LIKE '%@g.us' 
     AND m.chat_jid NOT LIKE '%@newsletter'
     AND ${periodFilter} 
     ${sessionFilter}`,
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

      // 6. Lead Aktif (Orang unik yang chat dalam 30 menit terakhir)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
         FROM wa_messages m 
         WHERE m.is_from_me = 0 
         AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.chat_jid NOT LIKE '%@newsletter'
         AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) 
         ${sessionFilter}`,
        [...finalSessionIds],
      ),

      // 7. Slow Response (Orang unik yang chatnya belum dibalas > 10 menit)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
         FROM wa_messages m 
         WHERE m.is_from_me = 0 
         AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.chat_jid NOT LIKE '%@newsletter'
         AND m.timestamp <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) 
         AND ${periodFilter} 
         ${sessionFilter} 
         AND NOT EXISTS (
           SELECT 1 FROM wa_messages r 
           WHERE r.chat_jid = m.chat_jid 
           AND r.is_from_me = 1 
           AND r.timestamp > m.timestamp
         )`,
        [...finalSessionIds],
      ),

      // 8. Tak Terjawab (Orang unik yang chatnya didiamkan > 24 jam)
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count 
         FROM wa_messages m 
         WHERE m.is_from_me = 0 
         AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.chat_jid NOT LIKE '%@newsletter'
         AND m.timestamp <= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
         AND ${periodFilter} 
         ${sessionFilter} 
         AND NOT EXISTS (
           SELECT 1 FROM wa_messages r 
           WHERE r.chat_jid = m.chat_jid 
           AND r.is_from_me = 1 
           AND r.timestamp > m.timestamp
         )`,
        [...finalSessionIds],
      ),

      // 9. Live Feed (Menampilkan PESAN TERAKHIR dari 15 orang berbeda)
      // Kita gunakan subquery atau GROUP BY agar feed tidak penuh oleh 1 orang yang sama
      query(
        `SELECT m.id, 
                COALESCE(ct.push_name, m.chat_jid) AS sender, 
                m.content AS message_text, 
                s.name AS received_via, 
                m.timestamp AS received_at 
         FROM wa_messages m
         INNER JOIN (
            SELECT MAX(id) as max_id 
            FROM wa_messages 
            WHERE is_from_me = 0 
            GROUP BY chat_jid
         ) last_msg ON m.id = last_msg.max_id
         LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid 
         LEFT JOIN wa_sessions s ON s.id = m.session_id 
         WHERE m.is_from_me = 0 
         AND m.chat_jid NOT LIKE '%@g.us' 
         AND m.chat_jid NOT LIKE '%@newsletter'
         ${sessionFilter} 
         ORDER BY m.timestamp DESC 
         LIMIT 15`,
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


// Route untuk membalas pesan otomatis (Auto-Reply)
router.post("/ai/reply-message", async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;

    if (!sessionId || !userMessage) {
      return res.status(400).json({
        success: false,
        message: "Session ID dan Pesan User wajib diisi",
      });
    }

    // 1. Ambil Materi Jawaban & Instruksi dari Database
    const settings = await queryOne(
      "SELECT bot_name, prompt, knowledge_base FROM wa_ai_settings WHERE session_id = ?",
      [sessionId]
    );

    // Jika setting tidak ditemukan, gunakan default atau berikan error
    const botName = settings?.bot_name || "Asisten Digital";
    const instruction = settings?.prompt || "Jawab dengan ramah dan sopan.";
    const knowledge = settings?.knowledge_base || "Hubungi admin untuk informasi lebih lanjut.";

    // 2. Kirim ke Gemini dengan Model Terbaru (Gemini 3 Flash)
    const response = await ai.models.generateContent({
      model: "gemini-3-flash",
      contents: `
        Anda adalah ${botName}.
        Instruksi Anda: ${instruction}
        
        Materi Pengetahuan (Hanya jawab berdasarkan informasi di bawah ini):
        ---
        ${knowledge}
        ---

        Pesan Masuk dari User: "${userMessage}"

        Aturan:
        - Jika jawaban ada di materi, jawab dengan detail dan bantu user.
        - Jika jawaban TIDAK ADA di materi, katakan dengan sopan bahwa Anda tidak tahu dan arahkan untuk menunggu admin.
        - Gunakan gaya bahasa yang sesuai dengan instruksi.
      `,
    });

    // 3. Ambil teks jawaban
    const aiReply = response.text;

    res.json({
      success: true,
      reply: aiReply,
    });

  } catch (error) {
    console.error("Auto-Reply Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memproses jawaban AI",
      error: error.message,
    });
  }
});


// ===============================================
// AI & ANTI-BAN SETTINGS ROUTES (SIMPLIFIED)
// ===============================================

// 1. Route Ambil List Konfigurasi
router.get("/ai-settings", authenticateToken, async (req, res) => {
  try {
    // Menambahkan human_wait_time ke dalam SELECT
    const allSettings = await query(
      `SELECT 
        session_id, 
        bot_name, 
        prompt, 
        knowledge_base, 
        min_delay, 
        max_delay, 
        max_messages_per_day, 
        human_wait_time, 
        is_active, 
        auto_read,
        auto_read_delay,
        after_read_delay,
        schedule_enabled,
        schedule_start_time,
        schedule_end_time,
        schedule_days,
        updated_at 
      FROM wa_ai_settings 
      ORDER BY updated_at DESC`
    );

    res.json({ success: true, data: allSettings });
  } catch (err) {
    console.error("[ERROR GET AI SETTINGS]:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Route Simpan atau Update Setting (Fokus: Materi, Anti-Ban & Human-First)
router.post("/ai-settings/save", authenticateToken, upload.array('files'), async (req, res) => {
  try {
    // 1. Destructuring data body - Pastikan humanWaitTime diambil
    const { 
      sessionId, 
      botName, 
      prompt, 
      knowledgeBase, 
      minDelay, 
      maxDelay, 
      maxMessagesPerDay,
      humanWaitTime,
      autoRead,
      autoReadDelay,
      afterReadDelay,
      scheduleEnabled,
      scheduleStartTime,
      scheduleEndTime,
      scheduleDays
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID wajib diisi" });
    }

    // Variabel untuk menampung teks mentah + hasil ekstraksi PDF
    let combinedKnowledge = knowledgeBase || "";

    // 2. Ekstraksi PDF
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const options = { disableFontFace: true };
          const data = await pdf(file.buffer, options);
          
          const cleanText = data.text
            .replace(/\n\s*\n/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();

          combinedKnowledge += `\n\n[SUMBER PDF: ${file.originalname}]\n${cleanText}`;
          console.log(`[SUCCESS] Ekstraksi PDF Berhasil: ${file.originalname}`);
        } catch (pdfErr) {
          console.error(`[ERROR PDF] Gagal scan ${file.originalname}:`, pdfErr.message);
        }
      }
    }

    // 3. Simpan ke Database - Menyertakan human_wait_time, auto_read, dan schedule
    const sql = `
      INSERT INTO wa_ai_settings 
      (session_id, bot_name, prompt, knowledge_base, min_delay, max_delay, max_messages_per_day, human_wait_time, auto_read, auto_read_delay, after_read_delay, schedule_enabled, schedule_start_time, schedule_end_time, schedule_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      bot_name=VALUES(bot_name), 
      prompt=VALUES(prompt), 
      knowledge_base=VALUES(knowledge_base), 
      min_delay=VALUES(min_delay), 
      max_delay=VALUES(max_delay), 
      max_messages_per_day=VALUES(max_messages_per_day),
      human_wait_time=VALUES(human_wait_time),
      auto_read=VALUES(auto_read),
      auto_read_delay=VALUES(auto_read_delay),
      after_read_delay=VALUES(after_read_delay),
      schedule_enabled=VALUES(schedule_enabled),
      schedule_start_time=VALUES(schedule_start_time),
      schedule_end_time=VALUES(schedule_end_time),
      schedule_days=VALUES(schedule_days)
    `;

    const values = [
      sessionId, 
      botName || "Bot WhatsApp", 
      prompt || "Anda adalah asisten cerdas.", 
      combinedKnowledge, 
      parseInt(minDelay) || 5, 
      parseInt(maxDelay) || 15, 
      parseInt(maxMessagesPerDay) || 200,
      parseInt(humanWaitTime) || 0,
      autoRead ? 1 : 0,
      parseInt(autoReadDelay) || 0,
      parseInt(afterReadDelay) || 3,
      scheduleEnabled ? 1 : 0,
      scheduleStartTime || "08:00:00",
      scheduleEndTime || "17:00:00",
      scheduleDays || "1,2,3,4,5,6,7"
    ];

    await query(sql, values);

    res.json({ 
      success: true, 
      message: "Konfigurasi Berhasil Disimpan!" 
    });

  } catch (err) {
    console.error("[CRITICAL ERROR SAVE AI]:", err);
    res.status(500).json({ 
      success: false, 
      message: "Terjadi kesalahan sistem: " + err.message 
    });
  }
});

// 3. Route Upload Media Asset (Gambar dengan Alias/Nama)
router.post("/ai-settings/upload-asset", authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { sessionId, assetName } = req.body;
    const file = req.file;

    // Validasi input
    if (!sessionId || !assetName || !file) {
      return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    }

    // 1. Buat URL Lengkap (Supaya frontend mudah menampilkan gambar)
    // Hasilnya nanti seperti: http://localhost:5000/uploads/media/namafile.jpg
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/media/${file.filename}`;

    // 2. Simpan ke database
    // Kita simpan URL lengkap di kolom file_path agar seragam dengan fitur Rules
    const sql = `INSERT INTO wa_ai_media_assets (session_id, asset_name, file_path) VALUES (?, ?, ?)`;
    await query(sql, [
      sessionId, 
      assetName.trim().toLowerCase(), 
      imageUrl // Menyimpan URL Lengkap
    ]);

    res.json({ 
      success: true, 
      message: `Asset ${assetName} berhasil disimpan!`,
      url: imageUrl 
    });
  } catch (err) {
    console.error("Upload Asset Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Route Ambil List Asset per Session
router.get("/ai-settings/assets/:sessionId", authenticateToken, async (req, res) => {
  try {
    const assets = await query(
      "SELECT id, asset_name, file_path FROM wa_ai_media_assets WHERE session_id = ?",
      [req.params.sessionId]
    );
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// 3. Route untuk Mengubah Status Aktif/Nonaktif AI (Toggle)
router.post("/ai-settings/toggle", authenticateToken, async (req, res) => {
  try {
    const { sessionId, is_active } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID wajib diisi" });
    }

    // Update status is_active di database
    // Pastikan kolom is_active sudah ada di tabel wa_ai_settings
    await query(
      "UPDATE wa_ai_settings SET is_active = ? WHERE session_id = ?",
      [is_active ? 1 : 0, sessionId]
    );

    res.json({ 
      success: true, 
      message: `AI berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/ai-settings/toggle-rules", authenticateToken, async (req, res) => {
  try {
    const { sessionId, is_rules_active } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID wajib diisi" });
    }

    // Pastikan nilai dikonversi menjadi 1 atau 0 untuk MySQL TINYINT
    const statusUpdate = is_rules_active ? 1 : 0;

    const result = await query(
      "UPDATE wa_ai_settings SET is_rules_active = ? WHERE session_id = ?",
      [statusUpdate, sessionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    res.json({ 
      success: true, 
      message: `Auto Rules berhasil ${statusUpdate === 1 ? 'diaktifkan' : 'dinonaktifkan'}` 
    });
  } catch (err) {
    console.error("Error toggle-rules:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ROUTES UNTUK WA RULES (AUTO-REPLY KEYWORD) ---

// 1. Ambil List Rules berdasarkan Session ID
router.get("/ai-rules/:sessionId", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Kolom image_url sekarang ikut diambil
    const rules = await query(
      "SELECT * FROM wa_rules WHERE session_id = ? ORDER BY created_at DESC",
      [sessionId]
    );
    res.json({ success: true, data: rules });
  } catch (err) {
    console.error("[ERROR GET RULES]:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Tambah atau Update Rule (Mendukung File Upload)
router.post("/ai-rules/save", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { id, sessionId, keyword, answer } = req.body;
    let imageUrl = req.body.imageUrl; // Jika edit dan tidak ganti gambar

    // Jika ada file baru yang diupload
    if (req.file) {
      // Dapatkan URL lengkap atau path relatif
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/rules/${req.file.filename}`;
    }

    if (!sessionId || !keyword || !answer) {
      return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    }

    const cleanKeyword = keyword.toLowerCase().trim();

    if (id && id !== "undefined") {
      await query(
        "UPDATE wa_rules SET keyword = ?, answer = ?, image_url = ? WHERE id = ? AND session_id = ?",
        [cleanKeyword, answer, imageUrl || null, id, sessionId]
      );
    } else {
      await query(
        "INSERT INTO wa_rules (session_id, keyword, answer, image_url) VALUES (?, ?, ?, ?)",
        [sessionId, cleanKeyword, answer, imageUrl || null]
      );
    }

    res.json({ success: true, message: "Rule berhasil disimpan!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Hapus Rule
router.post("/ai-rules/delete", authenticateToken, async (req, res) => {
  try {
    const { id, sessionId } = req.body;

    if (!id || !sessionId) {
      return res.status(400).json({ success: false, message: "ID dan Session ID diperlukan" });
    }

    await query("DELETE FROM wa_rules WHERE id = ? AND session_id = ?", [id, sessionId]);

    res.json({ success: true, message: "Aturan berhasil dihapus" });
  } catch (err) {
    console.error("[ERROR DELETE RULE]:", err);
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
// Cari bagian ini di routes.js
router.get("/sessions/:sessionId/chats", async (req, res) => {
  const { sessionId } = req.params;
  const { search = "", page = "1", limit = "50" } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  try {
    // 1. Naikkan limit GROUP_CONCAT agar JSON tidak terpotong (PENTING)
    await query("SET SESSION group_concat_max_len = 10000");

    // 2. Query utama untuk mengambil daftar chat beserta labelnya
    let sql = `
      SELECT 
        c.jid,
        c.session_id,
        c.name AS chat_name,
        c.last_message_time,
        c.last_message,
        c.last_message_type,
        c.unread_count,
        c.pinned,
        c.archived,
        c.muted,
        c.is_group,
        COALESCE(ct.name, ct.push_name, c.name, c.jid) AS display_name,
        COALESCE(c.profile_pic_url, ct.profile_pic_url) AS profile_pic_url,
        CONCAT('[', 
          COALESCE(GROUP_CONCAT(
            DISTINCT JSON_OBJECT(
              'id', l.id,
              'name', l.name,
              'color', l.color
            )
          ), ''), 
        ']') AS labels_string
      FROM wa_chats c
      LEFT JOIN wa_contacts ct 
        ON ct.session_id = c.session_id AND ct.jid = c.jid
      LEFT JOIN wa_chat_labels cl 
        ON cl.session_id = c.session_id AND cl.chat_jid = c.jid
      LEFT JOIN wa_labels l 
        ON l.wa_label_id = cl.wa_label_id AND l.session_id = cl.session_id
      WHERE c.session_id = ? 
        AND c.is_group = 0 
        AND c.jid NOT LIKE '%@newsletter'
        AND c.jid NOT LIKE 'status@broadcast'
    `;

    let params = [sessionId];

    // Filter Pencarian
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      sql += ` AND (
        COALESCE(ct.name, ct.push_name, c.name, c.jid) LIKE ? 
        OR c.jid LIKE ?
      )`;
      params.push(searchTerm, searchTerm);
    }

    // Grouping, Sorting, dan Pagination
    sql += ` GROUP BY c.jid, c.session_id 
             ORDER BY c.pinned DESC, c.last_message_time DESC 
             LIMIT ? OFFSET ?`;

    params.push(limitNum, offset);

    const chats = await query(sql, params);

    // 3. Parsing hasil query agar aman dikirim ke Frontend
    const parsedChats = chats.map((chat) => {
      let labels = [];
      try {
        if (chat.labels_string && chat.labels_string !== "[]") {
          // Bersihkan string JSON dari kemungkinan koma ganda hasil GROUP_CONCAT
          const cleanJson = chat.labels_string.replace(/,\]$/, "]");
          labels = JSON.parse(cleanJson);
        }
      } catch (e) {
        console.warn(`Gagal parsing label untuk JID ${chat.jid}:`, e.message);
        labels = [];
      }

      return {
        ...chat,
        labels: Array.isArray(labels)
          ? labels.filter((l) => l && l.id !== null)
          : [],
        unread_count: Number(chat.unread_count || 0),
        pinned: Number(chat.pinned || 0),
        archived: Number(chat.archived || 0),
        is_group: chat.is_group === 1 || chat.is_group === true,
      };
    });

    // 4. Hitung total data untuk pagination (agar angka 'Total' di UI benar)
    let countSql = `
      SELECT COUNT(DISTINCT c.jid) as total 
      FROM wa_chats c
      LEFT JOIN wa_contacts ct ON ct.session_id = c.session_id AND ct.jid = c.jid
      WHERE c.session_id = ? AND c.is_group = 0
      AND c.jid NOT LIKE '%@newsletter' AND c.jid NOT LIKE 'status@broadcast'
    `;
    let countParams = [sessionId];

    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      countSql += ` AND (COALESCE(ct.name, ct.push_name, c.name, c.jid) LIKE ? OR c.jid LIKE ?)`;
      countParams.push(searchTerm, searchTerm);
    }

    const [totalRow] = await query(countSql, countParams);
    const totalData = totalRow?.total || 0;

    // 5. Kirim Response ke Frontend
    res.json({
      success: true,
      data: parsedChats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalData,
        totalPages: Math.ceil(totalData / limitNum),
      },
    });
  } catch (err) {
    console.error("Backend Error Detail:", err);
    res.status(500).json({
      success: false,
      message: "Gagal memuat daftar chat: " + err.message,
    });
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

// ===============================================
// MESSAGE ROUTES
// ===============================================
// POST: Kirim pesan teks (INSTANT MODE)
router.post("/sessions/:sessionId/messages/text", async (req, res) => {
  const { sessionId } = req.params;
  const { to, text, quotedMsgId } = req.body;

  // 1. Validasi Input Dasar
  if (!to || !text) {
    return res.status(400).json({
      success: false,
      message: 'Parameter "to" dan "text" wajib diisi',
    });
  }

  try {
    // 2. Langsung Kirim (Tanpa Delay/Jeda)
    console.log(`[WhatsApp] Mengirim pesan instan ke ${to} via session ${sessionId}...`);

    const sent = await sendTextMessage(sessionId, to, text, quotedMsgId);

    // 3. Response Berhasil
    res.json({
      success: true,
      data: sent,
      message: "Pesan berhasil dikirim secara instan",
    });

  } catch (err) {
    console.error("Error kirim pesan:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengirim pesan: " + err.message
    });
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

// Lokasi: Backend Route /sessions/:sessionId/labels
router.get("/sessions/:sessionId/labels", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const labels = await query(
      `SELECT 
        l.id, 
        l.session_id, 
        l.wa_label_id, 
        l.name, 
        l.color,
        l.created_at,
        COUNT(cl.chat_jid) as chat_count
       FROM wa_labels l
       LEFT JOIN wa_chat_labels cl ON cl.wa_label_id = l.wa_label_id AND cl.session_id = l.session_id
       WHERE l.session_id = ?
       GROUP BY l.id, l.wa_label_id, l.session_id, l.name, l.color, l.created_at -- Tambahkan semua kolom di sini
       ORDER BY l.name ASC`,
      [sessionId],
    );
    res.json({ success: true, data: labels });
  } catch (err) {
    console.error("DEBUG ERROR LABELS:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ POST: Buat label baru di WhatsApp
router.post("/sessions/:sessionId/labels", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, color } = req.body;
    const session = sessions.get(sessionId);

    if (!session?.sock) {
      return res
        .status(404)
        .json({ success: false, message: "Sesi tidak ditemukan" });
    }

    // Cek apakah nama label sudah ada
    const existing = await query(
      "SELECT id FROM wa_labels WHERE session_id = ? AND name = ?",
      [sessionId, name.trim()],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Label dengan nama ini sudah ada" });
    }

    // ⚠️ addLabel Baileys tidak sync ke WA Business dengan benar
    // Solusi: sync dari WA HP — minta user buat label di HP,
    // sistem akan auto-detect via labels.edit event
    // Tapi tetap simpan ke DB lokal dulu dengan temp ID
    const tempId = `temp_${Date.now()}`;
    await query(
      `INSERT INTO wa_labels (session_id, wa_label_id, name, color) VALUES (?, ?, ?, ?)`,
      [sessionId, tempId, name.trim(), color || "#25D366"],
    );

    res.json({
      success: true,
      warning: true, // ✅ flag untuk frontend tampilkan pesan
      message:
        "Label disimpan lokal. Buat juga label dengan nama yang SAMA di WhatsApp Business HP agar tersinkron.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ PUT: Update label (hanya DB lokal, WA tidak support edit nama via API)
router.put("/sessions/:sessionId/labels/:waLabelId", async (req, res) => {
  try {
    const { sessionId, waLabelId } = req.params;
    const { name, color } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (color) {
      updates.push("color = ?");
      params.push(color);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Tidak ada data update" });
    }

    params.push(sessionId, waLabelId);
    await query(
      `UPDATE wa_labels SET ${updates.join(", ")} WHERE session_id = ? AND wa_label_id = ?`,
      params,
    );

    res.json({ success: true, message: "Label diperbarui di database" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ DELETE: Hapus label
router.delete("/sessions/:sessionId/labels/:waLabelId", async (req, res) => {
  try {
    const { sessionId, waLabelId } = req.params;
    const session = sessions.get(sessionId);

    // Coba hapus di WA juga jika ada method-nya
    if (session?.sock && typeof session.sock.deleteLabel === "function") {
      await session.sock.deleteLabel(waLabelId);
    }

    await query(
      "DELETE FROM wa_labels WHERE session_id = ? AND wa_label_id = ?",
      [sessionId, waLabelId],
    );

    res.json({ success: true, message: "Label berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ PUT: Assign/unassign label ke chat
router.put("/sessions/:sessionId/chats/:chatJid/labels", async (req, res) => {
  try {
    const { sessionId, chatJid } = req.params;
    const { labelIds } = req.body;
    const decodedJid = decodeURIComponent(chatJid);
    const session = sessions.get(sessionId);

    if (!session?.sock) {
      return res.status(404).json({ error: "Session tidak ditemukan" });
    }

    const sock = session.sock;

    const labelMethods = Object.keys(sock).filter((k) =>
      k.toLowerCase().includes("label"),
    );

    const current = await query(
      "SELECT wa_label_id FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ?",
      [sessionId, decodedJid],
    );
    const currentIds = current.map((c) => String(c.wa_label_id));
    const newIds = (labelIds || []).map((id) => String(id));
    const toAdd = newIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !newIds.includes(id));

    console.log(`JID: ${decodedJid} | +${toAdd} | -${toRemove}`);

    const addLabel = async (jid, labelId) => {
      if (typeof sock.addChatLabel === "function") {
        return await sock.addChatLabel(jid, labelId);
      } else if (typeof sock.labelChat === "function") {
        return await sock.labelChat(jid, labelId, "add");
      } else {
        throw new Error(
          `Tidak ada method assign label. Tersedia: ${labelMethods.join(", ")}`,
        );
      }
    };

    const removeLabel = async (jid, labelId) => {
      if (typeof sock.removeChatLabel === "function") {
        return await sock.removeChatLabel(jid, labelId);
      } else if (typeof sock.labelChat === "function") {
        return await sock.labelChat(jid, labelId, "remove");
      } else {
        throw new Error(
          `Tidak ada method remove label. Tersedia: ${labelMethods.join(", ")}`,
        );
      }
    };

    for (const labelId of toAdd) {
      await addLabel(decodedJid, labelId);
      await query(
        "INSERT IGNORE INTO wa_chat_labels (session_id, chat_jid, wa_label_id) VALUES (?, ?, ?)",
        [sessionId, decodedJid, labelId],
      );
      console.log(`✅ Label ${labelId} ditambahkan ke ${decodedJid}`);
    }

    for (const labelId of toRemove) {
      await removeLabel(decodedJid, labelId);
      await query(
        "DELETE FROM wa_chat_labels WHERE session_id = ? AND chat_jid = ? AND wa_label_id = ?",
        [sessionId, decodedJid, labelId],
      );
      console.log(`✅ Label ${labelId} dihapus dari ${decodedJid}`);
    }

    // ✅ io.emit dihapus — sudah di-handle otomatis oleh labels.association event dari Baileys
    res.json({ success: true, message: "Label berhasil disinkronkan" });
  } catch (err) {
    console.error("❌ FULL ERROR:", err.message);
    res.status(500).json({ error: err.message });
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