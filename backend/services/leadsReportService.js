// services/leadsReportService.js - Leads Report Generator & Sender
import { query, queryOne } from "../db.js";

async function buildOrganikFilter() {
  const organikKeywords = await query("SELECT keyword, is_active FROM organik_keywords WHERE is_active = TRUE");
  if (organikKeywords.length === 0) {
    return "AND LOWER(content) LIKE '%iya kakak%'";
  }
  const conditions = organikKeywords.map(k => `LOWER(content) LIKE '%${k.keyword.toLowerCase()}%'`).join(" OR ");
  return `AND (${conditions})`;
}

// Helper: get date range based on period type
function getDateRange(periodType) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (periodType === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startStr = weekAgo.toISOString().split("T")[0];
    return {
      startFull: `${startStr} 00:00:00`,
      endFull: `${todayStr} 23:59:59`,
      label: "Mingguan",
      dateLabel: `${weekAgo.toLocaleDateString("id-ID", { day: "numeric", month: "long" })} - ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    };
  }

  if (periodType === 'monthly') {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const startStr = monthAgo.toISOString().split("T")[0];
    return {
      startFull: `${startStr} 00:00:00`,
      endFull: `${todayStr} 23:59:59`,
      label: "Bulanan",
      dateLabel: `${monthAgo.toLocaleDateString("id-ID", { day: "numeric", month: "long" })} - ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    };
  }

  // Daily fallback
  return {
    startFull: `${todayStr} 00:00:00`,
    endFull: `${todayStr} 23:59:59`,
    label: "Harian",
    dateLabel: now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}

// Generate report for a SINGLE device/session - EXACTLY matching /social/media endpoint logic
export async function generateDeviceReport(sessionId, startDate, endDate, periodType = 'daily') {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let startFull, endFull, periodLabel, periodDateLabel;

  if (startDate && endDate) {
    startFull = startDate;
    endFull = endDate;
    periodLabel = periodType === 'weekly' ? 'Mingguan' : periodType === 'monthly' ? 'Bulanan' : 'Harian';
    periodDateLabel = '';
  } else {
    const range = getDateRange(periodType);
    startFull = range.startFull;
    endFull = range.endFull;
    periodLabel = range.label;
    periodDateLabel = range.dateLabel;
  }

  // Get session info
  const session = await queryOne("SELECT id, name, status FROM wa_sessions WHERE id = ?", [sessionId]);
  if (!session) return null;

  // 1. Get keywords for this session only
  const keywords = await query(
    "SELECT platform, keyword_text, session_id FROM lead_keywords WHERE session_id = ?",
    [sessionId]
  );

  // 2. Query messages
  const sqlMessages = `
    SELECT m.session_id, m.chat_jid, LOWER(m.content) as content
    FROM wa_messages m
    WHERE m.session_id = ? 
      AND m.is_from_me = 0 
      AND m.chat_jid NOT LIKE '%@g.us'
      AND m.timestamp BETWEEN ? AND ?
  `;

  // 3. Query closing
  const sqlClosing = `
    SELECT cl.session_id, COUNT(DISTINCT cl.chat_jid) as closing_count
    FROM wa_chat_labels cl
    JOIN wa_labels l ON cl.wa_label_id = l.wa_label_id
    WHERE cl.session_id = ?
      AND LOWER(l.name) LIKE '%closing%'
      AND cl.assigned_at BETWEEN ? AND ?
    GROUP BY cl.session_id
  `;

  // 4. Query organik
  const organikFilter = await buildOrganikFilter();
  const sqlOrganik = `
    SELECT COUNT(*) as organik_count 
    FROM wa_messages m
    WHERE session_id = ?
      AND is_from_me = 1 
      AND chat_jid NOT LIKE '%@g.us' 
      AND chat_jid NOT LIKE '%@newsletter'
      ${organikFilter}
      AND timestamp BETWEEN ? AND ?
  `;

  const [messages, closingData, organikData] = await Promise.all([
    query(sqlMessages, [sessionId, startFull, endFull]),
    query(sqlClosing, [sessionId, startFull, endFull]),
    query(sqlOrganik, [sessionId, startFull, endFull])
  ]);

  const totalClosing = closingData.length > 0 ? parseInt(closingData[0].closing_count) : 0;
  const totalOrganik = organikData.length > 0 ? parseInt(organikData[0].organik_count) : 0;

  // 5. Mapping - EXACTLY like /social/media
  const stats = {
    session_id: sessionId,
    totalPesanMasuk: 0,
    totalLeads: 0,
    totalClosing,
    totalOrganik
  };
  const uniqueSenders = { all_leads: new Set() };

  // Initialize platform keys
  keywords.forEach((k) => {
    const pKey = `leads_${k.platform.toLowerCase()}`;
    stats[pKey] = 0;
    uniqueSenders[pKey] = new Set();
  });

  messages.forEach((msg) => {
    const sender = msg.chat_jid;
    stats.totalPesanMasuk++;

    keywords.forEach((k) => {
      const platformKey = `leads_${k.platform.toLowerCase()}`;
      const searchKeyword = k.keyword_text.toLowerCase().trim();

      if (searchKeyword && msg.content && msg.content.includes(searchKeyword)) {
        if (!uniqueSenders[platformKey].has(sender)) {
          uniqueSenders[platformKey].add(sender);
          stats[platformKey]++;
        }
        if (!uniqueSenders.all_leads.has(sender)) {
          uniqueSenders.all_leads.add(sender);
          stats.totalLeads++;
        }
      }
    });
  });

  // TikTok leads
  const tiktokLeads = await query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
            SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
            SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count
     FROM tiktok_leads
     WHERE DATE(created_at) = ?`,
    [todayStr]
  );

  const convRate = stats.totalLeads > 0 ? Math.round((stats.totalClosing / stats.totalLeads) * 100) : 0;

  // Format report message
  const dateStr = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusEmoji = session.status === "connected" ? "🟢" : "🔴";
  const periodTitle = periodLabel.toUpperCase();

  let message = `📊 *LAPORAN LEADS ${periodTitle} - ${session.name.toUpperCase()}*\n`;
  message += `${statusEmoji} ${periodDateLabel || dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📌 *RINGKASAN ${periodTitle}*\n`;
  message += `👥 Total Leads: *${stats.totalLeads}*\n`;
  message += `🌿 Leads Organik: *${stats.totalOrganik}*\n`;
  message += `✅ Total Closing: *${stats.totalClosing}*\n\n`;

  // Platform breakdown
  const platformEntries = Object.entries(stats).filter(([key]) => key.startsWith("leads_") && stats[key] > 0);
  if (platformEntries.length > 0) {
    message += `📱 *PER PLATFORM*\n`;
    for (const [key, count] of platformEntries) {
      const label = key.replace("leads_", "").charAt(0).toUpperCase() + key.replace("leads_", "").slice(1);
      message += `  ${label}: *${count}*\n`;
    }
    message += `\n`;
  } else {
    message += `📱 *PER PLATFORM*\n  Belum ada leads dari platform tertentu\n\n`;
  }

  // TikTok leads
  if (tiktokLeads[0] && tiktokLeads[0].total > 0) {
    message += `🎵 *TIKTOK LEADS*\n`;
    message += `  Total: *${tiktokLeads[0].total}*\n`;
    message += `  Baru: *${tiktokLeads[0].new_count || 0}*\n`;
    message += `  Dihubungi: *${tiktokLeads[0].contacted_count || 0}*\n`;
    message += `  Converted: *${tiktokLeads[0].converted_count || 0}*\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Auto-generated by Satu Pintu Mendunia System_`;

  return {
    message,
    sessionId,
    sessionName: session.name,
    stats: {
      ...stats,
      sessionName: session.name,
      sessionStatus: session.status,
      convRate,
      tiktokLeads,
    },
  };
}

// Generate full report for ALL devices combined
export async function generateLeadsReport(startDate, endDate, periodType = 'daily') {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let startFull, endFull, periodLabel, periodDateLabel;

  if (startDate && endDate) {
    startFull = startDate;
    endFull = endDate;
    periodLabel = periodType === 'weekly' ? 'MINGGUAN' : periodType === 'monthly' ? 'BULANAN' : 'HARIAN';
    periodDateLabel = '';
  } else {
    const range = getDateRange(periodType);
    startFull = range.startFull;
    endFull = range.endFull;
    periodLabel = range.label.toUpperCase();
    periodDateLabel = range.dateLabel;
  }

  // Get all sessions
  const allowedSessions = await query("SELECT id, name, status FROM wa_sessions");
  if (allowedSessions.length === 0) return { message: "Tidak ada device yang terhubung.", stats: {} };

  // TikTok leads - use date range for weekly/monthly
  let tiktokLeads;
  if (periodType === 'weekly' || periodType === 'monthly') {
    const startDateOnly = startFull.split(' ')[0];
    const endDateOnly = endFull.split(' ')[0];
    tiktokLeads = await query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
              SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
              SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count
       FROM tiktok_leads
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDateOnly, endDateOnly]
    );
  } else {
    tiktokLeads = await query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
              SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
              SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count
       FROM tiktok_leads
       WHERE DATE(created_at) = ?`,
      [todayStr]
    );
  }

  // Generate report per device
  let grandTotalLeads = 0;
  let grandTotalClosing = 0;
  let grandTotalOrganik = 0;
  let grandTotalPesan = 0;
  const sessionStats = [];

  for (const s of allowedSessions) {
    const report = await generateDeviceReport(s.id, startFull, endFull, periodType);
    if (report && report.stats) {
      sessionStats.push({
        ...report.stats,
        sessionName: report.sessionName || s.name,
        sessionStatus: s.status,
      });
      grandTotalLeads += report.stats.totalLeads;
      grandTotalClosing += report.stats.totalClosing;
      grandTotalOrganik += report.stats.totalOrganik;
      grandTotalPesan += report.stats.totalPesanMasuk;
    }
  }

  const convRate = grandTotalLeads > 0 ? Math.round((grandTotalClosing / grandTotalLeads) * 100) : 0;

  const dateStr = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let message = `📊 *LAPORAN LEADS ${periodLabel} - MENDUNIA*\n`;
  message += `📅 ${periodDateLabel || dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📌 *RINGKASAN TOTAL ${periodLabel}*\n`;
  message += `👥 Total Leads: *${grandTotalLeads}*\n`;
  message += `🌿 Leads Organik: *${grandTotalOrganik}*\n`;
  message += `✅ Total Closing: *${grandTotalClosing}*\n`;
  message += `📈 Conversion Rate: *${convRate}%*\n\n`;

  message += `📲 *DETAIL PER DEVICE*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

  for (const d of sessionStats) {
    const deviceConvRate = d.totalLeads > 0 ? Math.round((d.totalClosing / d.totalLeads) * 100) : 0;
    const statusEmoji = d.sessionStatus === "connected" ? "🟢" : "🔴";

    message += `\n${statusEmoji} *${d.sessionName}*\n`;
    message += `  Leads: *${d.totalLeads}* | Organik: *${d.totalOrganik}*\n`;
    message += `  Closing: *${d.totalClosing}* | Conv: *${deviceConvRate}%*\n`;

    const platformEntries = Object.entries(d).filter(([key]) => key.startsWith("leads_") && d[key] > 0);
    if (platformEntries.length > 0) {
      message += `  📱 Platform:\n`;
      for (const [key, count] of platformEntries) {
        const label = key.replace("leads_", "").charAt(0).toUpperCase() + key.replace("leads_", "").slice(1);
        message += `    ${label}: *${count}*\n`;
      }
    }
    message += `  ──────────────────────\n`;
  }

  if (tiktokLeads[0] && tiktokLeads[0].total > 0) {
    message += `\n🎵 *TIKTOK LEADS*\n`;
    message += `  Total: *${tiktokLeads[0].total}*\n`;
    message += `  Baru: *${tiktokLeads[0].new_count || 0}*\n`;
    message += `  Dihubungi: *${tiktokLeads[0].contacted_count || 0}*\n`;
    message += `  Converted: *${tiktokLeads[0].converted_count || 0}*\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Auto-generated by Mendunia System_`;

  return {
    message,
    periodType,
    stats: {
      grandTotalLeads,
      grandTotalClosing,
      grandTotalOrganik,
      grandTotalPesan,
      convRate,
      sessionStats,
      tiktokLeads,
    },
  };
}

// Send report to groups - use SPECIFIC session to send
export async function sendReportToGroups(groupJids, report, targetSessionId = null) {
  const { sessions } = await import("../whatsapp.js");
  const results = [];

  console.log(`[Report] Sending to ${groupJids.length} groups, targetSession: ${targetSessionId || "any"}`);

  for (const groupJid of groupJids) {
    try {
      let sent = false;
      const fullJid = groupJid.endsWith("@g.us") ? groupJid : `${groupJid}@g.us`;

      // If targetSessionId specified, try that session first
      if (targetSessionId) {
        const sessionData = sessions.get(targetSessionId);
        if (sessionData && sessionData.sock && sessionData.sock.user) {
          try {
            await sessionData.sock.sendMessage(fullJid, { text: report.message });
            console.log(`[Report] ✅ Sent via target session ${targetSessionId}`);
            results.push({ groupJid: fullJid, sessionId: targetSessionId, status: "sent" });
            sent = true;
          } catch (e) {
            console.warn(`[Report] Target session ${targetSessionId} failed: ${e.message}`);
          }
        }
      }

      // If not sent yet, try any connected session
      if (!sent) {
        for (const [sessionId, sessionData] of sessions.entries()) {
          if (targetSessionId && sessionId === targetSessionId) continue; // already tried
          try {
            const sock = sessionData.sock;
            if (!sock || !sock.user) continue;

            await sock.sendMessage(fullJid, { text: report.message });
            console.log(`[Report] ✅ Sent via session ${sessionId}`);
            results.push({ groupJid: fullJid, sessionId, status: "sent" });
            sent = true;
            break;
          } catch (e) {
            console.warn(`[Report] Session ${sessionId} failed: ${e.message}`);
          }
        }
      }

      if (!sent) {
        results.push({ groupJid: fullJid, status: "failed", reason: "No connected session has this group" });
      }
    } catch (err) {
      results.push({ groupJid, status: "failed", reason: err.message });
    }
  }

  return results;
}
