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
    { name: "referer", sql: "ALTER TABLE rotator_clicks ADD COLUMN referer TEXT DEFAULT NULL" },
    { name: "country", sql: "ALTER TABLE rotator_clicks ADD COLUMN country VARCHAR(100) DEFAULT NULL" },
    { name: "city", sql: "ALTER TABLE rotator_clicks ADD COLUMN city VARCHAR(100) DEFAULT NULL" },
    { name: "device_type", sql: "ALTER TABLE rotator_clicks ADD COLUMN device_type VARCHAR(50) DEFAULT NULL" },
    { name: "browser", sql: "ALTER TABLE rotator_clicks ADD COLUMN browser VARCHAR(100) DEFAULT NULL" },
    { name: "os", sql: "ALTER TABLE rotator_clicks ADD COLUMN os VARCHAR(100) DEFAULT NULL" },
  ];

  for (const col of columnsToAdd) {
    try {
      const [rows] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rotator_clicks' AND COLUMN_NAME = ?",
        [process.env.DB_NAME || "whatsapp_system", col.name]
      );
      if (rows.length === 0) {
        await pool.query(col.sql);
        console.log(`✅ Added column: ${col.name}`);
      } else {
        console.log(`⏭️  Column already exists: ${col.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to add column ${col.name}: ${err.message}`);
    }
  }

  await pool.end();
  console.log("✅ Migration complete!");
}

migrate().catch(console.error);
