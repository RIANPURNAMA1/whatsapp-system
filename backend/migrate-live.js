import { query } from "./db.js";

const alterQueries = [
  `ALTER TABLE tiktok_live_reports ADD COLUMN viewers VARCHAR(50) DEFAULT NULL AFTER ocr_confidence`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN diamonds VARCHAR(50) DEFAULT NULL AFTER viewers`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN live_duration VARCHAR(50) DEFAULT NULL AFTER diamonds`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN gift_givers VARCHAR(50) DEFAULT NULL AFTER live_duration`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN new_followers VARCHAR(50) DEFAULT NULL AFTER gift_givers`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN comments_count VARCHAR(50) DEFAULT NULL AFTER new_followers`,
  `ALTER TABLE tiktok_live_reports ADD COLUMN leads_data JSON DEFAULT NULL AFTER comments_count`,
];

async function migrate() {
  console.log("🔄 Running migration for tiktok_live_reports...");
  for (const q of alterQueries) {
    try {
      await query(q);
      console.log(`  ✅ ${q.split("ADD COLUMN")[1].trim().split(" ")[0]}`);
    } catch (err) {
      if (err.message?.includes("Duplicate column")) {
        console.log(`  ⏭️  ${q.split("ADD COLUMN")[1].trim().split(" ")[0]} (already exists)`);
      } else {
        console.error(`  ❌ ${err.message}`);
      }
    }
  }
  console.log("✅ Migration selesai");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
