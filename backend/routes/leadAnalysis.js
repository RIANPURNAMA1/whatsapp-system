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

    const [leadResult, categories, extraDeviceData] = await Promise.all([
      getLeadAnalysis(targetId, period || "Minggu"),
      getAllCategories(),
      // Closing & lead counts per device
      query(`
        SELECT
          s.id AS session_id,
          COALESCE(cl.close_count, 0) AS closing_count,
          COALESCE(ld.lead_count, 0) AS lead_count,
          COALESCE(kw.keyword_lead_count, 0) AS keyword_lead_count
        FROM wa_sessions s
        LEFT JOIN (
          SELECT ct.session_id, COUNT(DISTINCT ct.chat_jid) AS close_count
          FROM closing_traffic ct
          WHERE 1=1
            ${period === "today" ? "AND DATE(ct.closing_time) = CURDATE()" : ""}
            ${period === "yesterday" ? "AND DATE(ct.closing_time) = SUBDATE(CURDATE(), 1)" : ""}
            ${period === "week" ? "AND ct.closing_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)" : ""}
            ${period === "month" ? "AND ct.closing_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)" : ""}
          GROUP BY ct.session_id
        ) cl ON s.id = cl.session_id
        LEFT JOIN (
          SELECT la.session_id, COUNT(DISTINCT la.chat_jid) AS lead_count
          FROM lead_analysis la
          WHERE 1=1
            ${period === "today" ? "AND DATE(la.detected_at) = CURDATE()" : ""}
            ${period === "yesterday" ? "AND DATE(la.detected_at) = SUBDATE(CURDATE(), 1)" : ""}
            ${period === "week" ? "AND la.detected_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)" : ""}
            ${period === "month" ? "AND la.detected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)" : ""}
          GROUP BY la.session_id
        ) ld ON s.id = ld.session_id
        LEFT JOIN (
          SELECT m.session_id, COUNT(DISTINCT m.chat_jid) AS keyword_lead_count
          FROM wa_messages m
          WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us'
            AND EXISTS (
              SELECT 1 FROM lead_keywords lk
              WHERE lk.session_id = m.session_id
                AND LOWER(m.content) LIKE CONCAT('%', LOWER(lk.keyword_text), '%')
            )
            ${period === "today" ? "AND DATE(m.timestamp) = CURDATE()" : ""}
            ${period === "yesterday" ? "AND DATE(m.timestamp) = SUBDATE(CURDATE(), 1)" : ""}
            ${period === "week" ? "AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)" : ""}
            ${period === "month" ? "AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)" : ""}
          GROUP BY m.session_id
        ) kw ON s.id = kw.session_id
        WHERE s.id IN (${allowedIds.map(() => '?').join(',')})
        ${targetId ? "AND s.id = ?" : ""}
      `, targetId ? [...allowedIds, targetId] : allowedIds),
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

    const extraMap = {};
    extraDeviceData.forEach(d => {
      extraMap[d.session_id] = {
        closing_count: parseInt(d.closing_count) || 0,
        lead_count: (parseInt(d.lead_count) || 0) + (parseInt(d.keyword_lead_count) || 0),
      };
    });

    const emptyDevice = {};
    catKeys.forEach(c => emptyDevice[c] = 0);

    const deviceData = allowedSessions
      .filter(s => !targetId || s.id === targetId)
      .map(s => ({
        name: s.name.toUpperCase(),
        ...(deviceMap[s.id] || { ...emptyDevice }),
        total: Object.values(deviceMap[s.id] || emptyDevice).reduce((a, b) => a + b, 0),
        closing_count: (extraMap[s.id]?.closing_count || 0),
        lead_count: (extraMap[s.id]?.lead_count || 0),
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
