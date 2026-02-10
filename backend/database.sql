-- ================================================
-- DATABASE: whatsapp_system
-- Jalankan file ini di MySQL untuk setup database
-- ================================================

CREATE DATABASE IF NOT EXISTS whatsapp_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE whatsapp_system;

-- ------------------------------------------------
-- Tabel sessions: Menyimpan sesi WhatsApp (multi-device)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_sessions (
  id VARCHAR(50) PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Default Session',
  phone_number VARCHAR(20) DEFAULT NULL,
  status ENUM('disconnected', 'connecting', 'connected', 'banned') DEFAULT 'disconnected',
  qr_code TEXT DEFAULT NULL,
  last_qr_at DATETIME DEFAULT NULL,
  connected_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------
-- Tabel contacts: Daftar kontak dari WhatsApp
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_contacts (
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
);

-- ------------------------------------------------
-- Tabel chats: Daftar percakapan / chat
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  jid VARCHAR(100) NOT NULL,
  name VARCHAR(200) DEFAULT NULL,
  is_group TINYINT(1) DEFAULT 0,
  unread_count INT DEFAULT 0,
  last_message TEXT DEFAULT NULL,
  last_message_time DATETIME DEFAULT NULL,
  last_message_from VARCHAR(100) DEFAULT NULL,
  pinned TINYINT(1) DEFAULT 0,
  archived TINYINT(1) DEFAULT 0,
  muted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat (session_id, jid),
  INDEX idx_session (session_id),
  INDEX idx_last_time (last_message_time DESC)
);

-- ------------------------------------------------
-- Tabel messages: Semua pesan masuk/keluar
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  message_id VARCHAR(200) NOT NULL,
  chat_jid VARCHAR(100) NOT NULL,
  from_jid VARCHAR(100) NOT NULL,
  to_jid VARCHAR(100) DEFAULT NULL,
  is_from_me TINYINT(1) DEFAULT 0,
  message_type ENUM('text','image','video','audio','document','sticker','location','contact','reaction','deleted','unknown') DEFAULT 'text',
  content TEXT DEFAULT NULL,
  caption TEXT DEFAULT NULL,
  media_url TEXT DEFAULT NULL,
  media_mime_type VARCHAR(100) DEFAULT NULL,
  media_file_size BIGINT DEFAULT NULL,
  quoted_message_id VARCHAR(200) DEFAULT NULL,
  quoted_content TEXT DEFAULT NULL,
  status ENUM('pending','sent','delivered','read','failed') DEFAULT 'pending',
  is_deleted TINYINT(1) DEFAULT 0,
  timestamp DATETIME NOT NULL,
  raw_data JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_message (session_id, message_id),
  INDEX idx_chat (session_id, chat_jid),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_from (from_jid)
);

-- ------------------------------------------------
-- Tabel groups: Info grup WhatsApp
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_groups (
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
);

-- ------------------------------------------------
-- Tabel group_participants: Anggota grup
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_group_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  group_jid VARCHAR(100) NOT NULL,
  participant_jid VARCHAR(100) NOT NULL,
  role ENUM('member','admin','superadmin') DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_participant (session_id, group_jid, participant_jid)
);

-- ------------------------------------------------
-- Insert session default
-- ------------------------------------------------
INSERT IGNORE INTO wa_sessions (id, name, status) VALUES ('default', 'Session Utama', 'disconnected');

-- Tampilkan tabel yang dibuat
SHOW TABLES;