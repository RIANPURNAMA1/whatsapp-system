router.get("/stats/dashboard", authenticateToken, async (req, res) => {
  try {
    const { period = "Hari ini", sessionId, startDate, endDate } = req.query;
    const userId = req.user.id;
    const roleType = req.user.role_type.toLowerCase().trim();

    // 1. Tentukan Device Mana Saja yang Berhak Diakses User Ini
    let allowedSessions = [];

    // System dan Manager disamakan: Bisa melihat SEMUA device
    if (roleType === "system" || roleType === "manager") {
      const allSess = await query(
        "SELECT id, name, status FROM wa_sessions ORDER BY name ASC",
      );
      allowedSessions = allSess;
    } else {
      // Role lain (Custom/Staff) hanya melihat yang di-assign di tabel pivot
      allowedSessions = await query(
        `SELECT s.id, s.name, s.status FROM wa_sessions s
         INNER JOIN wa_user_sessions us ON s.id = us.session_id
         WHERE us.user_id = ? 
         ORDER BY s.name ASC`,
        [userId],
      );
    }

    const allowedIds = allowedSessions.map((s) => s.id);

    // Jika user tidak punya akses ke device manapun, kembalikan data kosong
    if (allowedIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          pesanMasukAllTime: 0,
          pesanMasukToday: 0,
          pesanKeluar: 0,
          totalDevice: 0,
          deviceConnected: 0,
          leadMasuk: 0,
          leadAktif: 0,
          slowResponse: 0,
          unanswered: 0,
        },
        devices: [],
        messages: [],
        chartData: [],
        deviceStats: [],
      });
    }

    // 2. Filter Device (Security Check)
    let finalSessionFilterIds = [];
    const isSpecificDevice =
      sessionId && sessionId !== "all" && sessionId !== "Semua Device";

    if (isSpecificDevice) {
      if (!allowedIds.includes(sessionId)) {
        return res
          .status(403)
          .json({ success: false, message: "Akses device ditolak!" });
      }
      finalSessionFilterIds = [sessionId];
    } else {
      finalSessionFilterIds = allowedIds;
    }

    // Helper untuk SQL IN Clause
    const placeholders = finalSessionFilterIds.map(() => "?").join(",");
    const sessionFilter = `AND m.session_id IN (${placeholders})`;
    const sessionParams = finalSessionFilterIds;

    // 3. Build Period Filter
    const periodFilter = buildPeriodFilter(
      period,
      "m.timestamp",
      startDate,
      endDate,
    );
    const periodFilterInc = periodFilter.replace(/m\./g, "inc.");
    const sessionFilterInc = sessionFilter.replace(/m\./g, "inc.");

    // --- EXECUTE QUERIES (Parallelized for Performance) ---
    const [
      [rowPesanMasukAllTime],
      [rowPesanMasukPeriod],
      [rowPesanKeluar],
      [rowLeadMasuk],
      [rowLeadAktif],
      [rowSlowResponse],
      [rowUnanswered],
      liveMessages,
      trendData,
      devicePerformance,
    ] = await Promise.all([
      // 1. Total pesan masuk (ALL TIME)
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' ${sessionFilter}`,
        [...sessionParams],
      ),

      // 2. Pesan masuk (PERIODE)
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter}`,
        [...sessionParams],
      ),

      // 3. Pesan terkirim (PERIODE)
      query(
        `SELECT COUNT(*) AS count FROM wa_messages m WHERE m.is_from_me = 1 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter}`,
        [...sessionParams],
      ),

      // 5. Lead Masuk
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter} AND NOT EXISTS (SELECT 1 FROM wa_messages older WHERE older.chat_jid = m.chat_jid AND older.timestamp < (CASE WHEN '${period}' = 'Custom' THEN '${startDate}' ELSE CURDATE() END))`,
        [...sessionParams],
      ),

      // 6. Lead Aktif
      query(
        `SELECT COUNT(DISTINCT m.chat_jid) AS count FROM wa_messages m WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND m.timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) ${sessionFilter}`,
        [...sessionParams],
      ),

      // 7. Slow Response
      query(
        `SELECT COUNT(DISTINCT inc.chat_jid) AS count FROM wa_messages inc WHERE inc.is_from_me = 0 AND inc.chat_jid NOT LIKE '%@g.us' AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND ${periodFilterInc} ${sessionFilterInc} AND NOT EXISTS (SELECT 1 FROM wa_messages reply WHERE reply.chat_jid = inc.chat_jid AND reply.is_from_me = 1 AND reply.timestamp > inc.timestamp)`,
        [...sessionParams],
      ),

      // 8. Tak Terjawab
      query(
        `SELECT COUNT(DISTINCT inc.chat_jid) AS count FROM wa_messages inc WHERE inc.is_from_me = 0 AND inc.chat_jid NOT LIKE '%@g.us' AND inc.timestamp <= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND ${periodFilterInc} ${sessionFilterInc} AND NOT EXISTS (SELECT 1 FROM wa_messages reply WHERE reply.chat_jid = inc.chat_jid AND reply.is_from_me = 1 AND reply.timestamp > inc.timestamp)`,
        [...sessionParams],
      ),

      // 9. Live Feed
      query(
        `SELECT m.id, COALESCE(ct.name, ct.push_name, m.from_jid, m.chat_jid) AS sender, COALESCE(m.content, m.caption, '[Media]') AS message_text, s.name AS received_via, DATE_FORMAT(m.timestamp, '%Y-%m-%d %H:%i:%s') AS received_at FROM wa_messages m LEFT JOIN wa_contacts ct ON ct.session_id = m.session_id AND ct.jid = m.chat_jid LEFT JOIN wa_sessions s ON s.id = m.session_id WHERE m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' ${sessionFilter} ORDER BY m.timestamp DESC LIMIT 20`,
        [...sessionParams],
      ),

      // 10. Trend Data
      query(
        `SELECT ${["Minggu", "Bulan", "Custom"].includes(period) ? "DATE(m.timestamp)" : "DATE_FORMAT(m.timestamp, '%H:00')"} AS time, SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) AS masuk, SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) AS keluar FROM wa_messages m WHERE m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} ${sessionFilter} GROUP BY time ORDER BY time ASC`,
        [...sessionParams],
      ),

      // 11. Performa Device (Bar Chart) - menggunakan placeholders asli dari allowedIds agar menampilkan semua perbandingan device yang dimiliki
      query(
        `SELECT s.name, COUNT(DISTINCT m.chat_jid) AS lead_count FROM wa_sessions s LEFT JOIN wa_messages m ON s.id = m.session_id AND m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us' AND ${periodFilter} WHERE s.id IN (${allowedIds.map(() => "?").join(",")}) GROUP BY s.id, s.name`,
        [...allowedIds],
      ),
    ]);

    // 12. Final Response
    res.json({
      success: true,
      stats: {
        pesanMasukAllTime: rowPesanMasukAllTime?.count || 0,
        pesanMasukToday: rowPesanMasukPeriod?.count || 0,
        pesanKeluar: rowPesanKeluar?.count || 0,
        totalDevice: allowedSessions.length,
        deviceConnected: allowedSessions.filter((s) => s.status === "connected")
          .length,
        leadMasuk: rowLeadMasuk?.count || 0,
        leadAktif: rowLeadAktif?.count || 0,
        slowResponse: rowSlowResponse?.count || 0,
        unanswered: rowUnanswered?.count || 0,
      },
      devices: allowedSessions,
      messages: liveMessages || [],
      chartData: trendData || [],
      deviceStats: devicePerformance || [],
    });
  } catch (err) {
    console.error("Critical Dashboard Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});
