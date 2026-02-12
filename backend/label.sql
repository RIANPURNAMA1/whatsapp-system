-- ================================================
-- DATABASE UPDATE: Label & Grouping Feature
-- Tambahkan ke whatsapp_system database
-- ================================================

USE whatsapp_system;

-- ------------------------------------------------
-- Tabel labels: Daftar label/tag untuk grouping chat
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#00a884',
  icon VARCHAR(50) DEFAULT 'tag',
  description TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_label (session_id, name),
  INDEX idx_session (session_id)
);

-- ------------------------------------------------
-- Tabel chat_labels: Relasi many-to-many antara chat dan label
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS wa_chat_labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  chat_jid VARCHAR(100) NOT NULL,
  label_id INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_chat_label (session_id, chat_jid, label_id),
  INDEX idx_session_chat (session_id, chat_jid),
  INDEX idx_label (label_id),
  FOREIGN KEY (label_id) REFERENCES wa_labels(id) ON DELETE CASCADE
);

-- ------------------------------------------------
-- Insert default labels (opsional)
-- ------------------------------------------------
INSERT INTO wa_labels (session_id, name, color, icon, description) VALUES
('default', 'Hot Lead', '#ef4444', 'flame', 'Lead dengan prioritas tinggi'),
('default', 'Follow Up', '#f59e0b', 'clock', 'Perlu follow up lanjutan'),
('default', 'Customer', '#10b981', 'user-check', 'Customer aktif'),
('default', 'Prospek', '#3b82f6', 'target', 'Prospek potensial'),
('default', 'VIP', '#8b5cf6', 'crown', 'Customer VIP')
ON DUPLICATE KEY UPDATE name=name;

-- Tampilkan tabel yang dibuat
SHOW TABLES LIKE 'wa_%labels';