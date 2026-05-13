import express from "express";
import { query, queryOne } from "../db.js";

const router = express.Router();

router.get("/t/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const link = await queryOne(
      "SELECT * FROM tracked_links WHERE short_code = ?",
      [code]
    );

    if (!link) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1 style="color:#ef4444;">404 - Link Tidak Ditemukan</h1>
          <p>Mohon periksa kembali URL yang Anda masukkan.</p>
        </div>
      `);
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const startOfMonth = today.substring(0, 7) + "-01";

    const isNewDay = link.last_click_date !== today;
    const isNewWeek = !link.last_click_date || link.last_click_date < weekStart;
    const isNewMonth = !link.last_click_date || link.last_click_date < startOfMonth;

    let updates = ["clicks = clicks + 1"];
    if (isNewDay) {
      updates.push("clicks_today = 1");
    } else {
      updates.push("clicks_today = clicks_today + 1");
    }
    if (isNewWeek) {
      updates.push("clicks_week = 1");
    } else {
      updates.push("clicks_week = clicks_week + 1");
    }
    if (isNewMonth) {
      updates.push("clicks_month = 1");
    } else {
      updates.push("clicks_month = clicks_month + 1");
    }
    updates.push("last_click_date = ?");

    await query(
      `UPDATE tracked_links SET ${updates.join(", ")} WHERE id = ?`,
      [today, link.id]
    );

    console.log(`[Tracked Link] ${code} -> ${link.original_url}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.redirect(302, link.original_url);

  } catch (error) {
    console.error("SERVER ERROR AT TRACKED LINK:", error);
    res.status(500).send("Terjadi kesalahan pada sistem redirect.");
  }
});

export default router;
