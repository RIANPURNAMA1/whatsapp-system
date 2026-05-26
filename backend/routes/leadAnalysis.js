import express from "express";
import { query } from "../db.js";
import { authenticateToken } from "../auth.js";
import { getLeadAnalysis, computeBadLeads } from "../services/leadAnalysisService.js";
import { getAllCategories } from "../services/leadCategoryService.js";

const router = express.Router();

router.get("/leads/analysis", authenticateToken, async (req, res) => {
  try {
    const { sessionId, period = "Minggu" } = req.query;
    const userId = req.user.id;
    const roleType = req.user.role_type?.toLowerCase().trim();

    let allowedSessions = [];
    if (roleType === "system" || roleType === "manager") {
      allowedSessions = await query("SELECT id, name FROM wa_sessions ORDER BY name ASC");
    } else {
      allowedSessions = await query(
        `SELECT s.id, s.name FROM wa_sessions s 
         INNER JOIN wa_user_sessions us ON s.id = us.session_id 
         WHERE us.user_id = ? ORDER BY s.name ASC`, [userId]
      );
    }

    const allowedIds = allowedSessions.map(s => s.id);
    if (allowedIds.length === 0) {
      return res.json({ success: true, data: [], summary: {}, deviceData: [] });
    }

    const targetId = (sessionId && sessionId !== "all" && allowedIds.includes(sessionId)) ? sessionId : null;

    await computeBadLeads(targetId);

    const [leadResult, categories] = await Promise.all([
      getLeadAnalysis(targetId, period || "Minggu"),
      getAllCategories(),
    ]);

    const filteredData = leadResult.data.filter(d => allowedIds.includes(d.session_id));

    const catKeys = categories.map(c => c.name);

    const deviceMap = {};
    filteredData.forEach(d => {
      if (!deviceMap[d.session_id]) {
        deviceMap[d.session_id] = {};
        catKeys.forEach(c => deviceMap[d.session_id][c] = 0);
      }
      if (catKeys.includes(d.category)) deviceMap[d.session_id][d.category]++;
    });

    const emptyDevice = {};
    catKeys.forEach(c => emptyDevice[c] = 0);

    const deviceData = allowedSessions
      .filter(s => !targetId || s.id === targetId)
      .map(s => ({
        name: s.name.toUpperCase(),
        ...(deviceMap[s.id] || { ...emptyDevice }),
        total: Object.values(deviceMap[s.id] || emptyDevice).reduce((a, b) => a + b, 0)
      }));

    const summary = { total: filteredData.length };
    catKeys.forEach(c => summary[c] = filteredData.filter(d => d.category === c).length);

    res.json({
      success: true,
      data: filteredData,
      summary,
      deviceData,
      categories: categories.map(c => ({ key: c.name, label: c.label, color: c.color, icon: c.icon })),
    });
  } catch (error) {
    console.error("API Error at /leads/analysis:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;
