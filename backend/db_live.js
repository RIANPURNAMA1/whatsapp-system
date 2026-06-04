// TikTok Database Tables Migration
import { query } from "./db.js";

export const tiktokTables = [
  
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
  // Note: Don't use IF NOT EXISTS — not supported in MySQL 8.0
  const alterQueries = [
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN viewers VARCHAR(50) DEFAULT NULL AFTER ocr_confidence`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN diamonds VARCHAR(50) DEFAULT NULL AFTER viewers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN live_duration VARCHAR(50) DEFAULT NULL AFTER diamonds`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN gift_givers VARCHAR(50) DEFAULT NULL AFTER live_duration`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN new_followers VARCHAR(50) DEFAULT NULL AFTER gift_givers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN comments_count VARCHAR(50) DEFAULT NULL AFTER new_followers`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN leads_data JSON DEFAULT NULL AFTER comments_count`,
    `ALTER TABLE tiktok_live_reports 
     ADD COLUMN report_date DATE DEFAULT NULL AFTER leads_data`,
  ];

  for (const alterQuery of alterQueries) {
    try {
      await query(alterQuery);
    } catch (err) {
      if (err.message && err.message.includes("Duplicate column")) {
        // Column already exists — no problem
      } else {
        console.error("❌ Error altering tiktok_live_reports:", err.message);
      }
    }
  }

  console.log("✅ TikTok tables migration completed");
}

export default migrateTikTokTables;
