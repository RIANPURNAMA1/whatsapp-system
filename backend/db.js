import mysql from "mysql2";
import "dotenv/config";

// 1. CREATE POOL (OPTIMIZED)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "whatsapp_system",
  charset: "utf8mb4",
  timezone: "+07:00", // ⭐ WAJIB: Agar filter tanggal Custom pas dengan WIB
  dateStrings: true, // ⭐ PENTING: Mengambil tanggal dari MySQL sebagai STRING, bukan objek Date JS
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
    `CREATE TABLE IF NOT EXISTS lead_keywords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(50),
  session_id VARCHAR(255), -- Tambahkan kolom ini untuk ID Perangkat
  keyword_text TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Gabungkan platform dan session_id sebagai kunci unik
  UNIQUE KEY unique_platform_per_session (platform, session_id) 
)`,
    // ⭐ TABEL BARU: wa_lead_sources (UNTUK TRACKING IKLAN)
    `CREATE TABLE IF NOT EXISTS wa_lead_sources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      keyword VARCHAR(255) NOT NULL UNIQUE,
      source_name VARCHAR(100) NOT NULL,
      color_code VARCHAR(20) DEFAULT '#8696A0',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS organik_keywords (
      id INT AUTO_INCREMENT PRIMARY KEY,
      keyword VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 1. BUAT TABEL ROLE DULU
    // Di file db.js
    `CREATE TABLE IF NOT EXISTS sys_roles (
  id INT AUTO_INCREMENT PRIMARY KEY, -- WAJIB ADA AUTO_INCREMENT
  name VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('system', 'manager', 'custom') DEFAULT 'custom',
  description TEXT
) ENGINE=InnoDB`,

    // 2. BUAT TABEL USER
    // Di dalam file db.js pada bagian array tables:
    `CREATE TABLE IF NOT EXISTS wa_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    branch VARCHAR(100) DEFAULT 'Pusat',
    last_login DATETIME DEFAULT NULL, -- Digunakan untuk status ON/OFF di UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE SET NULL
) ENGINE=InnoDB;`,

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
  wa_label_id VARCHAR(50) NULL, -- Simpan ID asli dari WhatsApp di sini
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#00a884',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_label (session_id, name),
  UNIQUE KEY unique_wa_id (session_id, wa_label_id) -- Agar tidak duplikat per sesi
)`,

    // wa_chat_labels
    `CREATE TABLE IF NOT EXISTS wa_chat_labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  chat_jid VARCHAR(100) NOT NULL,
  wa_label_id VARCHAR(50) NOT NULL, -- Gunakan WA Label ID agar sinkronisasi lebih mudah
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat_label (session_id, chat_jid, wa_label_id)
) 
 `,

    `CREATE TABLE IF NOT EXISTS wa_ai_settings (
      session_id VARCHAR(50) PRIMARY KEY,
      is_active TINYINT(1) DEFAULT 0,
      is_rules_active TINYINT(1) DEFAULT 1,
      bot_name VARCHAR(100),
      prompt TEXT,
      knowledge_base TEXT,
      min_delay INT DEFAULT 5,
      max_delay INT DEFAULT 15,
      max_messages_per_day INT DEFAULT 200,
      human_wait_time INT DEFAULT 0,
      read_delay INT DEFAULT 2,
      auto_read TINYINT(1) DEFAULT 0,
      auto_read_delay INT DEFAULT 0,
      after_read_delay INT DEFAULT 3,
      schedule_enabled TINYINT(1) DEFAULT 0,
      schedule_start_time TIME DEFAULT '08:00:00',
      schedule_end_time TIME DEFAULT '17:00:00',
      schedule_days VARCHAR(20) DEFAULT '0,1,2,3,4,5,6',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`,
`CREATE TABLE IF NOT EXISTS link_rotators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_code VARCHAR(100) UNIQUE NOT NULL,
        type ENUM('direct', 'lander') DEFAULT 'direct',
        target_type ENUM('single', 'rotator') DEFAULT 'single',
        wa_numbers TEXT NOT NULL,
        message TEXT,
        clicks INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES wa_users(id) ON DELETE CASCADE
    )`,

    // ⭐ TAMBAHKAN TABEL INI (UNTUK FIX ERROR 404/NOT FOUND STATS)
    `CREATE TABLE IF NOT EXISTS rotator_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rotator_id INT NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        referer TEXT DEFAULT NULL,
        country VARCHAR(100) DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        device_type VARCHAR(50) DEFAULT NULL,
        browser VARCHAR(100) DEFAULT NULL,
        os VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (rotator_id),
        INDEX (created_at),
        FOREIGN KEY (rotator_id) REFERENCES link_rotators(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS tracked_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) UNIQUE,
    clicks INT DEFAULT 0,
    clicks_today INT DEFAULT 0,
    clicks_week INT DEFAULT 0,
    clicks_month INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_click_date DATE DEFAULT NULL
)`,
`
CREATE TABLE IF NOT EXISTS wa_ai_media_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50),
    asset_name VARCHAR(100), -- Contoh: 'syarat_jepang', 'alur_proses'
    file_path VARCHAR(255),  -- Path file di server
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES wa_ai_settings(session_id) ON DELETE CASCADE
)`,

`
CREATE TABLE IF NOT EXISTS wa_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL, -- Kolom baru untuk gambar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (session_id),
    INDEX (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS platform_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      platform ENUM('whatsapp', 'tiktok', 'instagram', 'facebook') NOT NULL,
      settings_key VARCHAR(100) NOT NULL,
      settings_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_platform_setting (platform, settings_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS general_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      settings_key VARCHAR(100) UNIQUE NOT NULL,
      settings_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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

    // 2. ⭐ SEEDING LEAD SOURCES (TRACKING IKLAN)
    const leadSources = [
      ["iklan-fb", "Facebook Ads", "#1877F2"],
      ["iklan-ig", "Instagram Ads", "#E4405F"],
      ["iklan-tk", "TikTok Ads", "#000000"],
      ["google-ads", "Google Ads", "#4285F4"],
    ];
    for (const source of leadSources) {
      await db
        .promise()
        .query(
          `INSERT IGNORE INTO wa_lead_sources (keyword, source_name, color_code) VALUES (?, ?, ?)`,
          source,
        );
    }

    // Migrate tracked_links: add short_code if not exists
    try {
      await db.promise().query(`
        ALTER TABLE tracked_links ADD COLUMN short_code VARCHAR(50) UNIQUE AFTER original_url
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for tracked_links:", err.message);
      }
    }

    // Migrate wa_ai_settings: add read_delay if not exists
    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN read_delay INT DEFAULT 2 AFTER human_wait_time
      `);
      console.log("✅ Added read_delay column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for wa_ai_settings:", err.message);
      }
    }

    // Migrate wa_ai_settings: add auto_read and schedule columns if not exists
    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN auto_read TINYINT(1) DEFAULT 0 AFTER read_delay
      `);
      console.log("✅ Added auto_read column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for auto_read:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN auto_read_delay INT DEFAULT 0 AFTER auto_read
      `);
      console.log("✅ Added auto_read_delay column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for auto_read_delay:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN after_read_delay INT DEFAULT 3 AFTER auto_read_delay
      `);
      console.log("✅ Added after_read_delay column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for after_read_delay:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN schedule_enabled TINYINT(1) DEFAULT 0 AFTER after_read_delay
      `);
      console.log("✅ Added schedule_enabled column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for schedule_enabled:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN schedule_start_time TIME DEFAULT '08:00:00' AFTER schedule_enabled
      `);
      console.log("✅ Added schedule_start_time column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for schedule_start_time:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN schedule_end_time TIME DEFAULT '17:00:00' AFTER schedule_start_time
      `);
      console.log("✅ Added schedule_end_time column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for schedule_end_time:", err.message);
      }
    }

    try {
      await db.promise().query(`
        ALTER TABLE wa_ai_settings ADD COLUMN schedule_days VARCHAR(20) DEFAULT '0,1,2,3,4,5,6' AFTER schedule_end_time
      `);
      console.log("✅ Added schedule_days column to wa_ai_settings");
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn("⚠️ Migration warning for schedule_days:", err.message);
      }
    }

    // Fix existing schedule_days values (convert 1-7 to 0-6)
    try {
      await db.promise().query(`
        UPDATE wa_ai_settings 
        SET schedule_days = '0,1,2,3,4,5,6' 
        WHERE schedule_days = '1,2,3,4,5,6,7'
      `);
      console.log("✅ Fixed schedule_days values from 1-7 to 0-6 format");
    } catch (err) {
      console.warn("⚠️ Migration warning for fixing schedule_days:", err.message);
    }

    // Leads Report Settings
    try {
      await db.promise().query(`
        CREATE TABLE IF NOT EXISTS leads_report_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          is_enabled TINYINT(1) DEFAULT 0,
          report_time TIME DEFAULT '17:00:00',
          report_days VARCHAR(20) DEFAULT '1,2,3,4,5',
          target_groups JSON DEFAULT NULL,
          last_sent_date DATE DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Created leads_report_settings table");
    } catch (err) {
      console.warn("⚠️ Migration warning for leads_report_settings:", err.message);
    }

    // Add last_sent_date column to existing leads_report_settings table
    try {
      await db.promise().query(`
        ALTER TABLE leads_report_settings 
        ADD COLUMN IF NOT EXISTS last_sent_date DATE DEFAULT NULL AFTER target_groups
      `);
      console.log("✅ Added last_sent_date to leads_report_settings");
    } catch (err) {
      // MySQL < 8.0.19 doesn't support IF NOT EXISTS in ALTER TABLE
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("✅ last_sent_date already exists in leads_report_settings");
      } else {
        console.warn("⚠️ Migration warning for last_sent_date:", err.message);
      }
    }

    // Generate short_code for existing tracked_links without short_code
    const existingLinks = await db.promise().query(
      "SELECT id FROM tracked_links WHERE short_code IS NULL OR short_code = ''"
    );
    if (existingLinks[0].length > 0) {
      console.log(`🔄 Generating short_codes for ${existingLinks[0].length} existing tracked links...`);
      for (const link of existingLinks[0]) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let shortCode = '';
        for (let i = 0; i < 6; i++) {
          shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        try {
          await db.promise().query(
            "UPDATE tracked_links SET short_code = ? WHERE id = ? AND (short_code IS NULL OR short_code = '')",
            [shortCode, link.id]
          );
        } catch (e) {
          // Handle duplicate short_code
          let retryCode = '';
          for (let i = 0; i < 6; i++) {
            retryCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          await db.promise().query(
            "UPDATE tracked_links SET short_code = ? WHERE id = ?",
            [retryCode, link.id]
          );
        }
      }
    }

    console.log("✅ Semua tabel dan data awal WhatsApp System siap digunakan");
  } catch (err) {
    console.error("❌ Gagal inisialisasi tabel:", err.message);
    throw err;
  }
}

export default db;
