import { ensureDbReady, query } from "./db.js";

async function clearAllData() {
  try {
    console.log("🚀 Menghubungkan ke database...");

    await ensureDbReady();

    console.log("⚠️ Menghapus semua data...");

    await query(`SET FOREIGN_KEY_CHECKS = 0`);

    const tables = [
      "wa_chat_labels",
      "wa_group_participants",
      "wa_groups",
      "wa_messages",
      "wa_chats",
      "wa_contacts",
      "wa_user_sessions",
      "wa_sessions",
      "wa_users",
      "wa_labels",
    ];

    for (const table of tables) {
      await query(`TRUNCATE TABLE ${table}`);
      console.log(`✅ ${table} dikosongkan`);
    }

    await query(`SET FOREIGN_KEY_CHECKS = 1`);

    console.log("🔥 Semua data berhasil dihapus!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal menghapus data:", err.message);
    process.exit(1);
  }
}

clearAllData();