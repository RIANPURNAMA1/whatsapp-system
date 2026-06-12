import { Router } from "express";
import { authenticateToken } from "../auth.js";
import { query } from "../db.js";

const router = Router();

// GET /lead-products - List all products (with optional session filter)
router.get("/lead-products", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.query;
    let sql = `
      SELECT lp.*, ws.name AS session_name
      FROM lead_products lp
      LEFT JOIN wa_sessions ws ON lp.session_id = ws.id
      WHERE 1=1
    `;
    const params = [];
    if (session_id) {
      sql += " AND lp.session_id = ?";
      params.push(session_id);
    }
    sql += " ORDER BY lp.created_at DESC";
    const products = await query(sql, params);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /lead-products/sessions - List available sessions for product assignment
router.get("/lead-products/sessions", authenticateToken, async (req, res) => {
  try {
    const sessions = await query("SELECT id, name, phone_number FROM wa_sessions ORDER BY name ASC");
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /lead-products - Create product
router.post("/lead-products", authenticateToken, async (req, res) => {
  try {
    const { name, template_text, session_id } = req.body;
    if (!name || !template_text) {
      return res.status(400).json({ success: false, message: "Nama dan template teks harus diisi" });
    }
    const result = await query(
      "INSERT INTO lead_products (name, template_text, session_id) VALUES (?, ?, ?)",
      [name, template_text, session_id || null]
    );
    const product = await query(
      `SELECT lp.*, ws.name AS session_name
       FROM lead_products lp
       LEFT JOIN wa_sessions ws ON lp.session_id = ws.id
       WHERE lp.id = ?`,
      [result.insertId]
    );
    res.json({ success: true, data: product[0], message: "Produk berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /lead-products/:id - Update product
router.put("/lead-products/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, template_text, session_id } = req.body;
    if (!name || !template_text) {
      return res.status(400).json({ success: false, message: "Nama dan template teks harus diisi" });
    }
    await query(
      "UPDATE lead_products SET name = ?, template_text = ?, session_id = ? WHERE id = ?",
      [name, template_text, session_id || null, id]
    );
    const product = await query(
      `SELECT lp.*, ws.name AS session_name
       FROM lead_products lp
       LEFT JOIN wa_sessions ws ON lp.session_id = ws.id
       WHERE lp.id = ?`,
      [id]
    );
    if (!product[0]) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }
    res.json({ success: true, data: product[0], message: "Produk berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /lead-products/:id - Delete product
router.delete("/lead-products/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM lead_products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan" });
    }
    res.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /lead-products/assignments - Get all assignments with product info
router.get("/lead-products/assignments", authenticateToken, async (req, res) => {
  try {
    const { product_id, session_id, date_filter, start_date, end_date } = req.query;
    let sql = `
      SELECT lpa.*, lp.name AS product_name, lp.template_text,
             wc.name AS contact_name,
             ws.name AS session_name
      FROM lead_product_assignments lpa
      JOIN lead_products lp ON lpa.product_id = lp.id
      LEFT JOIN wa_chats wc ON lpa.session_id = wc.session_id AND lpa.chat_jid = wc.jid
      LEFT JOIN wa_sessions ws ON lpa.session_id = ws.id
      WHERE 1=1
    `;
    const params = [];
    if (product_id) {
      sql += " AND lpa.product_id = ?";
      params.push(product_id);
    }
    if (session_id) {
      sql += " AND lpa.session_id = ?";
      params.push(session_id);
    }
    // Date filtering
    if (date_filter === "hari_ini") {
      sql += " AND DATE(lpa.assigned_at) = CURDATE()";
    } else if (date_filter === "kemarin") {
      sql += " AND DATE(lpa.assigned_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    } else if (date_filter === "minggu_ini") {
      sql += " AND YEARWEEK(lpa.assigned_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (date_filter === "bulan_ini") {
      sql += " AND MONTH(lpa.assigned_at) = MONTH(CURDATE()) AND YEAR(lpa.assigned_at) = YEAR(CURDATE())";
    } else if (date_filter === "custom" && start_date && end_date) {
      sql += " AND DATE(lpa.assigned_at) >= ? AND DATE(lpa.assigned_at) <= ?";
      params.push(start_date, end_date);
    }
    sql += " ORDER BY lpa.assigned_at DESC";
    const assignments = await query(sql, params);
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /lead-products/stats - Get product stats (count per product)
router.get("/lead-products/stats", authenticateToken, async (req, res) => {
  try {
    const { date_filter, start_date, end_date } = req.query;
    let joinSql = "";
    let whereSql = "";
    const params = [];
    if (date_filter === "hari_ini") {
      whereSql = " AND DATE(lpa.assigned_at) = CURDATE()";
    } else if (date_filter === "kemarin") {
      whereSql = " AND DATE(lpa.assigned_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    } else if (date_filter === "minggu_ini") {
      whereSql = " AND YEARWEEK(lpa.assigned_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (date_filter === "bulan_ini") {
      whereSql = " AND MONTH(lpa.assigned_at) = MONTH(CURDATE()) AND YEAR(lpa.assigned_at) = YEAR(CURDATE())";
    } else if (date_filter === "custom" && start_date && end_date) {
      whereSql = " AND DATE(lpa.assigned_at) >= ? AND DATE(lpa.assigned_at) <= ?";
      params.push(start_date, end_date);
    }
    const stats = await query(`
      SELECT lp.id, lp.name, lp.template_text, lp.session_id, ws.name AS session_name,
             COUNT(lpa.id) AS total_leads
      FROM lead_products lp
      LEFT JOIN lead_product_assignments lpa ON lp.id = lpa.product_id
      LEFT JOIN wa_sessions ws ON lp.session_id = ws.id
      WHERE 1=1${whereSql}
      GROUP BY lp.id
      ORDER BY total_leads DESC
    `, params);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /lead-products/assignments/:id - Remove assignment
router.delete("/lead-products/assignments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM lead_product_assignments WHERE id = ?", [id]);
    res.json({ success: true, message: "Assignment berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
