// TikTok Database Tables Migration
import { query } from "./db.js";

export const tiktokTables = [
  // TikTok Comments
  `CREATE TABLE IF NOT EXISTS tiktok_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    content TEXT,
    video_id VARCHAR(100),
    video_title VARCHAR(500),
    status ENUM('new', 'replied', 'spam', 'deleted') DEFAULT 'new',
    replied_at DATETIME,
    replied_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status),
    INDEX (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Comment Replies
  `CREATE TABLE IF NOT EXISTS tiktok_comment_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    message TEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (comment_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Messages (DM)
  `CREATE TABLE IF NOT EXISTS tiktok_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    message TEXT NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    sent_by INT,
    status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (direction),
    INDEX (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Leads
  `CREATE TABLE IF NOT EXISTS tiktok_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(255),
    source VARCHAR(50) DEFAULT 'tiktok',
    platform VARCHAR(50) DEFAULT 'tiktok',
    message TEXT,
    video_id VARCHAR(100),
    video_title VARCHAR(500),
    contact_info JSON,
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
    assigned_to INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status),
    INDEX (source),
    INDEX (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Accounts
  `CREATE TABLE IF NOT EXISTS tiktok_accounts (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    shop_id VARCHAR(100),
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    last_sync DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Auto-Reply Rules
  `CREATE TABLE IF NOT EXISTS tiktok_rules (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    reply TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    priority INT DEFAULT 0,
    match_type ENUM('exact', 'contains', 'starts_with') DEFAULT 'contains',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Videos (for tracking)
  `CREATE TABLE IF NOT EXISTS tiktok_videos (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    video_id VARCHAR(100) NOT NULL,
    title VARCHAR(500),
    thumbnail_url TEXT,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Analytics Summary (daily)
  `CREATE TABLE IF NOT EXISTS tiktok_analytics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    new_followers INT DEFAULT 0,
    video_views BIGINT DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    new_leads INT DEFAULT 0,
    converted_leads INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    avg_response_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // TikTok Live Reports
  `CREATE TABLE IF NOT EXISTS tiktok_live_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_url TEXT NOT NULL,
    image_filename VARCHAR(255),
    extracted_text LONGTEXT,
    ocr_confidence DECIMAL(5,2),
    report_title VARCHAR(255),
    report_description TEXT,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status),
    INDEX (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

export async function migrateTikTokTables() {
  console.log("🔄 Migrating TikTok tables...");
  
  for (const tableQuery of tiktokTables) {
    try {
      await query(tableQuery);
    } catch (err) {
      if (!err.message.includes("already exists")) {
        console.error("❌ Error creating TikTok table:", err.message);
      }
    }
  }
  
  // Add new columns for parsed TikTok live data
  const alterQueries = [
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS viewers VARCHAR(50) DEFAULT NULL AFTER ocr_confidence`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS diamonds VARCHAR(50) DEFAULT NULL AFTER viewers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS live_duration VARCHAR(50) DEFAULT NULL AFTER diamonds`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS gift_givers VARCHAR(50) DEFAULT NULL AFTER live_duration`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS new_followers VARCHAR(50) DEFAULT NULL AFTER gift_givers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS comments_count VARCHAR(50) DEFAULT NULL AFTER new_followers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN IF NOT EXISTS leads_data JSON DEFAULT NULL AFTER comments_count`,
  ];

  for (const alterQuery of alterQueries) {
    try {
      await query(alterQuery);
    } catch (err) {
      // Ignore if column already exists
      if (!err.message.includes("Duplicate column")) {
        console.error("❌ Error altering tiktok_live_reports:", err.message);
      }
    }
  }

  console.log("✅ TikTok tables migration completed");
}

export default migrateTikTokTables;
