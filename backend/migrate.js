import mysql from "mysql2/promise";
import "dotenv/config";

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "whatsapp_system",
  });

  console.log("🔄 Running migrations...");

  const columnsToAdd = [
    { name: "referer", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN referer TEXT DEFAULT NULL" },
    { name: "country", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN country VARCHAR(100) DEFAULT NULL" },
    { name: "city", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN city VARCHAR(100) DEFAULT NULL" },
    { name: "device_type", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN device_type VARCHAR(50) DEFAULT NULL" },
    { name: "browser", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN browser VARCHAR(100) DEFAULT NULL" },
    { name: "os", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN os VARCHAR(100) DEFAULT NULL" },
    { name: "queue_delay", table: "leads_report_settings", sql: "ALTER TABLE leads_report_settings ADD COLUMN queue_delay INT DEFAULT 3000 AFTER last_sent_date" },
    { name: "source", table: "rotator_clicks", sql: "ALTER TABLE rotator_clicks ADD COLUMN source VARCHAR(100) DEFAULT NULL AFTER referer" },
  ];

  for (const col of columnsToAdd) {
    try {
      const [rows] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        [process.env.DB_NAME || "whatsapp_system", col.table, col.name]
      );
      if (rows.length === 0) {
        await pool.query(col.sql);
        console.log(`✅ Added column: ${col.name} to ${col.table}`);
      } else {
        console.log(`⏭️  Column already exists: ${col.name} in ${col.table}`);
      }
    } catch (err) {
      console.error(`❌ Failed to add column ${col.name}: ${err.message}`);
    }
  }

  await pool.end();
  console.log("✅ Migration complete!");
}

migrate().catch(console.error);
