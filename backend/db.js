import mysql from "mysql2";
import "dotenv/config";

// 1. CREATE POOL
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "whatsapp_system",
  charset: "utf8mb4", // ⭐ TAMBAHKAN INI
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
});

// Status kontrol agar tidak balapan (Race Condition)
let isInitialized = false;
let initPromise = null;

// 2. FUNGSI UNTUK MEMASTIKAN DATABASE SIAP
export async function ensureDbReady() {
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const connection = await db.promise().getConnection();
      console.log("✅ MySQL Pool Connected (WhatsApp System)");
      connection.release();

      await initDatabase();

      isInitialized = true;
      return true;
    } catch (err) {
      console.error("❌ Database Readiness Error:", err.message);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

// 3. HELPER FUNCTIONS
export const query = async (sql, params) => {
  await ensureDbReady();
  const [results] = await db.promise().query(sql, params);
  return results;
};

export const queryOne = async (sql, params) => {
  await ensureDbReady();
  const [results] = await db.promise().query(sql, params);
  return results[0] || null;
};

/**
 * MENGAMBIL SESSION BERDASARKAN ROLE USER
 * - Jika role type 'system': Tampilkan semua session.
 * - Jika role type 'custom': Hanya tampilkan session yang terdaftar di wa_user_sessions.
 */
export const getUserSessions = async (userId) => {
  const sql = `
    SELECT DISTINCT s.* FROM wa_sessions s
    JOIN wa_users u ON u.id = ?
    JOIN sys_roles r ON u.role_id = r.id
    LEFT JOIN wa_user_sessions us ON s.id = us.session_id AND us.user_id = u.id
    WHERE r.type = 'system' 
       OR (r.type = 'custom' AND us.user_id = ?)
    ORDER BY s.created_at DESC
  `;
  return await query(sql, [userId, userId]);
};

/**
 * MENDAFTARKAN AKSES SESSION KE USER TERTENTU
 */
export const assignSessionToUser = async (userId, sessionId) => {
  const sql = `INSERT IGNORE INTO wa_user_sessions (user_id, session_id) VALUES (?, ?)`;
  return await query(sql, [userId, sessionId]);
};

// 4. LOGIKA AUTO-MIGRATE / INIT TABEL
async function initDatabase() {
  const tables = [
    // Tabel Role
    `CREATE TABLE IF NOT EXISTS sys_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      type ENUM('system','manager', 'custom') DEFAULT 'custom',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tabel User
    `CREATE TABLE IF NOT EXISTS wa_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      role_id INT,
      branch VARCHAR(100),
      last_login DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE SET NULL
    )`,

    // wa_sessions
    `CREATE TABLE IF NOT EXISTS wa_sessions (
      id VARCHAR(50) PRIMARY KEY NOT NULL,
      name VARCHAR(100) NOT NULL DEFAULT 'Default Session',
      phone_number VARCHAR(20) DEFAULT NULL,
      status ENUM('disconnected', 'connecting', 'connected', 'banned') DEFAULT 'disconnected',
      qr_code TEXT DEFAULT NULL,
      last_qr_at DATETIME DEFAULT NULL,
      connected_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // TABEL PIVOT: Relasi User ke Session (Kunci untuk Role Custom)
    `CREATE TABLE IF NOT EXISTS wa_user_sessions (
      user_id INT,
      session_id VARCHAR(50),
      PRIMARY KEY (user_id, session_id),
      FOREIGN KEY (user_id) REFERENCES wa_users(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES wa_sessions(id) ON DELETE CASCADE
    )`,

    // wa_contacts
    `CREATE TABLE IF NOT EXISTS wa_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      jid VARCHAR(100) NOT NULL,
      name VARCHAR(200) DEFAULT NULL,
      push_name VARCHAR(200) DEFAULT NULL,
      phone_number VARCHAR(30) DEFAULT NULL,
      profile_pic_url TEXT DEFAULT NULL,
      is_business TINYINT(1) DEFAULT 0,
      is_group TINYINT(1) DEFAULT 0,
      last_seen DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_contact (session_id, jid),
      INDEX idx_session (session_id),
      INDEX idx_jid (jid)
    )`,

    // wa_chats
    `CREATE TABLE IF NOT EXISTS wa_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  jid VARCHAR(100) NOT NULL,
  name VARCHAR(200) DEFAULT NULL,
  profile_pic_url TEXT DEFAULT NULL, -- ⭐ Tambahkan kolom ini
  is_group TINYINT(1) DEFAULT 0,
  unread_count INT DEFAULT 0,
  last_message TEXT DEFAULT NULL,
  last_message_time DATETIME DEFAULT NULL,
  last_message_from VARCHAR(100) DEFAULT NULL,
  last_message_type VARCHAR(50) DEFAULT 'text',
  pinned TINYINT(1) DEFAULT 0,
  archived TINYINT(1) DEFAULT 0,
  muted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat (session_id, jid),
  INDEX idx_session (session_id)
)`,

    // wa_messages
    `CREATE TABLE IF NOT EXISTS wa_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      message_id VARCHAR(200) NOT NULL,
      chat_jid VARCHAR(100) NOT NULL,
      from_jid VARCHAR(100) NOT NULL,
      to_jid VARCHAR(100) DEFAULT NULL,
      is_from_me TINYINT(1) DEFAULT 0,
      -- DIUBAH DARI ENUM KE VARCHAR AGAR TIDAK ERROR "DATA TRUNCATED"
      message_type VARCHAR(50) DEFAULT 'text', 
      content TEXT DEFAULT NULL,
      caption TEXT DEFAULT NULL,
      media_url TEXT DEFAULT NULL,
      media_mime_type VARCHAR(100) DEFAULT NULL,
      media_file_size BIGINT DEFAULT NULL,
      quoted_message_id VARCHAR(200) DEFAULT NULL,
      quoted_content TEXT DEFAULT NULL,
      -- STATUS TETAP ENUM KARENA NILAINYA PASTI (sent, read, dll)
      status ENUM('pending','sent','delivered','read','failed','received') DEFAULT 'pending',
      is_deleted TINYINT(1) DEFAULT 0,
      timestamp DATETIME NOT NULL,
      raw_data JSON DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_message (session_id, message_id),
      INDEX idx_chat (session_id, chat_jid),
      INDEX idx_timestamp (timestamp DESC)
    )`,
    // wa_groups
    `CREATE TABLE IF NOT EXISTS wa_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      jid VARCHAR(100) NOT NULL,
      subject VARCHAR(300) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      owner_jid VARCHAR(100) DEFAULT NULL,
      profile_pic_url TEXT DEFAULT NULL,
      participant_count INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_group (session_id, jid)
    )`,

    // wa_group_participants
    `CREATE TABLE IF NOT EXISTS wa_group_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      group_jid VARCHAR(100) NOT NULL,
      participant_jid VARCHAR(100) NOT NULL,
      role ENUM('member','admin','superadmin') DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_participant (session_id, group_jid, participant_jid)
    )`,

    // wa_labels
    `CREATE TABLE IF NOT EXISTS wa_labels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#00a884',
      icon VARCHAR(50) DEFAULT 'tag',
      description TEXT DEFAULT NULL,
      sort_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_label (session_id, name)
    )`,

    // wa_chat_labels
    `CREATE TABLE IF NOT EXISTS wa_chat_labels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(50) NOT NULL,
      chat_jid VARCHAR(100) NOT NULL,
      label_id INT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_chat_label (session_id, chat_jid, label_id),
      FOREIGN KEY (label_id) REFERENCES wa_labels(id) ON DELETE CASCADE
    )`,
  ];

  try {
    for (const queryStr of tables) {
      await db.promise().query(queryStr);
    }

    // --- SEEDING DEFAULT DATA ---

    // 1. Insert Default Roles
    await db.promise().query(`
  INSERT IGNORE INTO sys_roles (id, name, type, description) VALUES 
  (1, 'Super Admin', 'system', 'Akses penuh ke seluruh sistem'),
  (3, 'Cabang', 'custom', 'Akses terbatas pada session yang didaftarkan')
`);

    // 3. Insert Default Labels
    const defaultLabels = [
      ["default", "Hot Lead", "#ef4444", "flame"],
      ["default", "Follow Up", "#f59e0b", "clock"],
      ["default", "Customer", "#10b981", "user-check"],
    ];

    for (const label of defaultLabels) {
      await db
        .promise()
        .query(
          `INSERT IGNORE INTO wa_labels (session_id, name, color, icon) VALUES (?, ?, ?, ?)`,
          label,
        );
    }

    console.log("✅ Semua tabel dan data awal WhatsApp System siap digunakan");
  } catch (err) {
    console.error("❌ Gagal inisialisasi tabel:", err.message);
    throw err;
  }
}

export default db;
