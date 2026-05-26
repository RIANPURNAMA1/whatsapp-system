// TikTok Routes - API endpoints for TikTok integration
import express from "express";
import { query, queryOne } from "../db.js";
import { authenticateToken } from "../auth.js";

const router = express.Router();

// ========== TIKTOK COMMENTS ==========

// GET: Get TikTok comments
router.get("/comments", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = "";
    let params = [];
    
    if (status) {
      whereClause = "WHERE status = ?";
      params.push(status);
    }
    
    const [comments] = await query(
      `SELECT * FROM tiktok_comments ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM tiktok_comments ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult[0]?.total || 0,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error("Error get TikTok comments:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Reply to TikTok comment
router.post("/comments/:id/reply", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;
    
    if (!message) {
      return res.status(400).json({ success: false, error: "Message required" });
    }
    
    const comment = await queryOne("SELECT * FROM tiktok_comments WHERE id = ?", [id]);
    if (!comment) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }
    
    // Simulate TikTok API reply (in production, use actual TikTok API)
    const replyResult = {
      id: `reply_${Date.now()}`,
      comment_id: id,
      message,
      created_at: new Date()
    };
    
    // Update comment status
    await query(
      "UPDATE tiktok_comments SET status = 'replied', replied_at = NOW(), replied_by = ? WHERE id = ?",
      [userId, id]
    );
    
    // Log reply
    await query(
      "INSERT INTO tiktok_comment_replies (comment_id, message, created_by) VALUES (?, ?, ?)",
      [id, message, userId]
    );
    
    res.json({ success: true, data: replyResult });
  } catch (err) {
    console.error("Error reply to TikTok comment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT: Update comment status
router.put("/comments/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["new", "replied", "spam", "deleted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    
    await query("UPDATE tiktok_comments SET status = ? WHERE id = ?", [status, id]);
    
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("Error update comment status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== TIKTOK MESSAGES (DM) ==========

// GET: Get TikTok DMs
router.get("/messages", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const [messages] = await query(
      `SELECT * FROM tiktok_messages ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), offset]
    );
    
    const [totalResult] = await query("SELECT COUNT(*) as total FROM tiktok_messages");
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Error get TikTok messages:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Send message to TikTok user
router.post("/messages/send", authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const senderId = req.user?.id;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, error: "UserId and message required" });
    }
    
    // Simulate sending message via TikTok API
    const sentMessage = {
      id: `msg_${Date.now()}`,
      user_id: userId,
      message,
      sent_by: senderId,
      created_at: new Date(),
      status: "sent"
    };
    
    await query(
      "INSERT INTO tiktok_messages (user_id, message, direction, sent_by) VALUES (?, ?, 'outbound', ?)",
      [userId, message, senderId]
    );
    
    res.json({ success: true, data: sentMessage });
  } catch (err) {
    console.error("Error send TikTok message:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== TIKTOK LEADS ==========

// GET: Get TikTok leads
router.get("/leads", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, source } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = "WHERE platform = 'tiktok'";
    let params = [];
    
    if (source) {
      whereClause += " AND source = ?";
      params.push(source);
    }
    
    const [leads] = await query(
      `SELECT * FROM tiktok_leads ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM tiktok_leads ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Error get TikTok leads:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Create TikTok lead from webhook
router.post("/leads/webhook", async (req, res) => {
  try {
    const { userId, username, message, videoId, videoTitle } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: "UserId required" });
    }
    
    const lead = {
      id: `lead_${Date.now()}`,
      user_id: userId,
      username: username || `user_${userId}`,
      source: "tiktok",
      platform: "tiktok",
      message: message || "",
      video_id: videoId || "",
      video_title: videoTitle || "",
      status: "new",
      created_at: new Date()
    };
    
    await query(
      `INSERT INTO tiktok_leads (user_id, username, source, platform, message, video_id, video_title, status) 
       VALUES (?, ?, 'tiktok', 'tiktok', ?, ?, ?, 'new')`,
      [userId, username, message, videoId, videoTitle]
    );
    
    res.json({ success: true, data: lead });
  } catch (err) {
    console.error("Error create TikTok lead:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Count TikTok leads (for dashboard card)
router.get("/leads/count", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = "WHERE platform = 'tiktok'";
    let params = [];

    if (startDate && endDate) {
      whereClause += " AND DATE(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const [rows] = await query(
      `SELECT COUNT(*) as total FROM tiktok_leads ${whereClause}`,
      params
    );

    res.json({
      success: true,
      total: rows[0]?.total || 0,
    });
  } catch (err) {
    console.error("Error count TikTok leads:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== TIKTOK ANALYTICS ==========

// GET: Get TikTok analytics
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const [comments] = await query(`
      SELECT 
        status,
        COUNT(*) as count 
      FROM tiktok_comments 
      GROUP BY status
    `);
    
    const [messages] = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count 
      FROM tiktok_messages 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    const [leads] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM tiktok_leads 
      WHERE platform = 'tiktok'
    `);
    
    res.json({
      success: true,
      data: {
        comments: comments.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        messages,
        leads: leads[0] || { total: 0, new_leads: 0, converted: 0 }
      }
    });
  } catch (err) {
    console.error("Error get TikTok analytics:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== TIKTOK SETTINGS ==========

// GET: Get TikTok account settings
router.get("/accounts", authenticateToken, async (req, res) => {
  try {
    const accounts = await query(
      "SELECT * FROM tiktok_accounts WHERE user_id = ? ORDER BY created_at DESC",
      [req.user?.id]
    );
    
    res.json({ success: true, data: accounts });
  } catch (err) {
    console.error("Error get TikTok accounts:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Add TikTok account
router.post("/accounts", authenticateToken, async (req, res) => {
  try {
    const { username, accessToken, shopId } = req.body;
    
    if (!username || !accessToken) {
      return res.status(400).json({ success: false, error: "Username and accessToken required" });
    }
    
    const account = {
      id: `tiktok_acc_${Date.now()}`,
      user_id: req.user?.id,
      username,
      access_token: accessToken,
      shop_id: shopId,
      status: "active",
      created_at: new Date()
    };
    
    await query(
      `INSERT INTO tiktok_accounts (id, user_id, username, access_token, shop_id, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [account.id, account.user_id, username, accessToken, shopId]
    );
    
    res.json({ success: true, data: account });
  } catch (err) {
    console.error("Error add TikTok account:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Remove TikTok account
router.delete("/accounts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await query("DELETE FROM tiktok_accounts WHERE id = ? AND user_id = ?", [id, req.user?.id]);
    
    res.json({ success: true, message: "Account removed" });
  } catch (err) {
    console.error("Error remove TikTok account:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Get TikTok rules (auto-reply)
router.get("/rules", authenticateToken, async (req, res) => {
  try {
    const rules = await query(
      "SELECT * FROM tiktok_rules WHERE user_id = ? ORDER BY priority ASC",
      [req.user?.id]
    );
    
    res.json({ success: true, data: rules });
  } catch (err) {
    console.error("Error get TikTok rules:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Create auto-reply rule
router.post("/rules", authenticateToken, async (req, res) => {
  try {
    const { keyword, reply, isActive = true, priority = 0 } = req.body;
    
    if (!keyword || !reply) {
      return res.status(400).json({ success: false, error: "Keyword and reply required" });
    }
    
    const rule = {
      id: `rule_${Date.now()}`,
      user_id: req.user?.id,
      keyword,
      reply,
      is_active: isActive,
      priority,
      created_at: new Date()
    };
    
    await query(
      `INSERT INTO tiktok_rules (id, user_id, keyword, reply, is_active, priority) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rule.id, rule.user_id, keyword, reply, isActive ? 1 : 0, priority]
    );
    
    res.json({ success: true, data: rule });
  } catch (err) {
    console.error("Error create TikTok rule:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT: Toggle rule
router.put("/rules/:id/toggle", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await query(
      "UPDATE tiktok_rules SET is_active = NOT is_active WHERE id = ? AND user_id = ?",
      [id, req.user?.id]
    );
    
    res.json({ success: true, message: "Rule toggled" });
  } catch (err) {
    console.error("Error toggle TikTok rule:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE: Delete rule
router.delete("/rules/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await query("DELETE FROM tiktok_rules WHERE id = ? AND user_id = ?", [id, req.user?.id]);
    
    res.json({ success: true, message: "Rule deleted" });
  } catch (err) {
    console.error("Error delete TikTok rule:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
