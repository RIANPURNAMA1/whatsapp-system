// rotatorRoutes.js
import express from "express";
import { query, queryOne } from "../db.js"; // Sesuaikan path ke db.js kamu

const router = express.Router();

/**
 * GET: Ambil semua link rotator
 * Endpoint: GET /api/rotators
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type;

    // Logic: Admin system bisa lihat semua, user biasa hanya milik sendiri
    let sql = "SELECT * FROM link_rotators";
    let params = [];

    if (roleType !== 'system') {
      sql += " WHERE user_id = ?";
      params.push(userId);
    }
    
    sql += " ORDER BY created_at DESC";
    const data = await query(sql, params);
    
    // Format data agar sesuai dengan kebutuhan frontend React
    const formattedData = data.map(item => ({
      ...item,
      url: `${req.protocol}://${req.get('host')}/r/${item.short_code}`,
      shortCode: item.short_code,
      waNumbers: item.wa_numbers,
      targetType: item.target_type
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error Get Rotators:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST: Simpan Link Rotator Baru
 * Endpoint: POST /api/rotators
 */
router.post("/", async (req, res) => {
  // 1. Ambil data dan pastikan tidak ada yang undefined
  const { name, shortCode, type, targetType, waNumbers, message } = req.body;
  const userId = req.user?.id; // Pastikan middleware authenticateToken memberikan data ini

  console.log("Data yang diterima backend:", req.body); // Log untuk debug

  if (!userId) {
    return res.status(401).json({ success: false, message: "User ID tidak ditemukan, silakan login ulang" });
  }

  try {
    // 2. Gunakan query yang sesuai dengan kolom di database kamu
    const result = await query(
      `INSERT INTO link_rotators 
      (user_id, name, short_code, type, target_type, wa_numbers, message) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        name, 
        shortCode, 
        type || 'direct', 
        targetType || 'single', 
        waNumbers, 
        message || ''
      ]
    );

    res.json({ 
      success: true, 
      message: "Berhasil disimpan",
      data: { id: result.insertId } 
    });

  } catch (error) {
    console.error("ERROR DATABASE:", error); // INI PENTING: Lihat pesan ini di terminal
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Slug/Shortcode sudah terpakai" });
    }
    
    // Kirim pesan error asli ke frontend agar kita tahu masalahnya
    res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
});

/**
 * DELETE: Hapus Link Rotator
 * Endpoint: DELETE /api/rotators/:id
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const roleType = req.user.role_type;

  try {
    // Keamanan: Cek kepemilikan data
    const checkSql = roleType === 'system' 
      ? "SELECT id FROM link_rotators WHERE id = ?" 
      : "SELECT id FROM link_rotators WHERE id = ? AND user_id = ?";
    
    const params = roleType === 'system' ? [id] : [id, userId];
    const existing = await queryOne(checkSql, params);

    if (!existing) {
      return res.status(403).json({ success: false, message: "Akses ditolak atau data tidak ditemukan" });
    }

    await query("DELETE FROM link_rotators WHERE id = ?", [id]);
    res.json({ success: true, message: "Link rotator berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET: Ambil Statistik Klik Link Rotator
 * Endpoint: GET /api/rotators/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user.id;
    const roleType = req.user.role_type;
    const { start_date, end_date } = req.query;

    // Default: hari ini
    const today = new Date();
    const startDate = start_date || today.toISOString().split('T')[0];
    const endDate = end_date || today.toISOString().split('T')[0];

    // Ambil semua rotator
    let rotatorSql = "SELECT * FROM link_rotators";
    let rotatorParams = [];
    
    if (roleType !== 'system') {
      rotatorSql += " WHERE user_id = ?";
      rotatorParams.push(userId);
    }
    
    const rotators = await query(rotatorSql, rotatorParams);

    // Ambil statistik klik dari rotator_clicks
    const statsSql = `
      SELECT 
        rotator_id,
        DATE(created_at) as click_date,
        COUNT(*) as click_count
      FROM rotator_clicks 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY rotator_id, DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `;
    
    const statsData = await query(statsSql, [startDate, endDate]);

    // Ambil total clicks per rotator dalam periode
    const totalSql = `
      SELECT 
        rotator_id,
        COUNT(*) as total_clicks
      FROM rotator_clicks 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY rotator_id
    `;
    
    const totalData = await query(totalSql, [startDate, endDate]);

    // Buat mapping total clicks
    const totalMap = {};
    totalData.forEach(item => {
      totalMap[item.rotator_id] = item.total_clicks;
    });

    // Buat mapping daily clicks
    const dailyMap = {};
    statsData.forEach(item => {
      if (!dailyMap[item.rotator_id]) {
        dailyMap[item.rotator_id] = [];
      }
      dailyMap[item.rotator_id].push({
        date: item.click_date,
        count: item.click_count
      });
    });

    // Format response
    const links = rotators.map(rotator => ({
      id: rotator.id,
      name: rotator.name,
      short_code: rotator.short_code,
      total: totalMap[rotator.id] || 0,
      daily: dailyMap[rotator.id] || []
    }));

    const totalClicks = Object.values(totalMap).reduce((sum, val) => sum + parseInt(val), 0);

    res.json({ 
      success: true, 
      data: { 
        total_clicks: totalClicks,
        links: links 
      } 
    });
  } catch (error) {
    console.error("Error Get Rotator Stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET: Ambil Detail Statistik per Link Rotator
 * Endpoint: GET /api/rotators/:id/stats
 */
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roleType = req.user.role_type;
    const { start_date, end_date } = req.query;

    // Cek kepemilikan
    let checkSql = "SELECT * FROM link_rotators WHERE id = ?";
    let checkParams = [id];
    
    if (roleType !== 'system') {
      checkSql += " AND user_id = ?";
      checkParams.push(userId);
    }
    
    const rotator = await queryOne(checkSql, checkParams);
    
    if (!rotator) {
      return res.status(404).json({ success: false, message: "Rotator tidak ditemukan" });
    }

    // Default: hari ini
    const today = new Date();
    const startDate = start_date || today.toISOString().split('T')[0];
    const endDate = end_date || today.toISOString().split('T')[0];

    // Ambil statistik harian
    const statsSql = `
      SELECT 
        DATE(created_at) as click_date,
        COUNT(*) as click_count
      FROM rotator_clicks 
      WHERE rotator_id = ? AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY click_date DESC
    `;
    
    const statsData = await query(statsSql, [id, startDate, endDate]);

    // Total dalam periode
    const totalSql = `
      SELECT COUNT(*) as total
      FROM rotator_clicks 
      WHERE rotator_id = ? AND DATE(created_at) BETWEEN ? AND ?
    `;
    
    const totalResult = await queryOne(totalSql, [id, startDate, endDate]);

    res.json({ 
      success: true, 
      data: {
        id: rotator.id,
        name: rotator.name,
        short_code: rotator.short_code,
        total: totalResult?.total || 0,
        daily: statsData.map(item => ({
          date: item.click_date,
          count: item.click_count
        }))
      }
    });
  } catch (error) {
    console.error("Error Get Rotator Detail Stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;