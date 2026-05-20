import mysql from "mysql2/promise";
import "dotenv/config";

async function dbFresh() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "whatsapp_system",
  });

  try {
    console.log("🚀 Menghubungkan ke database...");

    const [rows] = await pool.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
      [process.env.DB_NAME || "whatsapp_system"]
    );

    const tables = rows.map((r) => r.TABLE_NAME);

    if (tables.length === 0) {
      console.log("✅ Tidak ada tabel untuk dibersihkan.");
      process.exit(0);
    }

    console.log(`⚠️  Menghapus ${tables.length} tabel...`);

    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`  ✅ ${table} dikosongkan`);
    }

    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("🔥 Semua data berhasil dihapus!");
  } catch (err) {
    console.error("❌ Gagal menghapus data:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dbFresh();
