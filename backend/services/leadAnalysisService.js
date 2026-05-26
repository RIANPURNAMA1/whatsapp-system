import { query, queryOne } from "../db.js";
import { getAllCategories, matchKeywords } from "./leadCategoryService.js";

function toMySQLDatetime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function saveKendala(sessionId, chatJid, category, notes) {
  try {
    const contact = await queryOne(
      "SELECT name, push_name FROM wa_contacts WHERE session_id = ? AND jid = ?",
      [sessionId, chatJid]
    );
    const contactName = contact?.name || contact?.push_name || chatJid.split('@')[0] || 'Unknown';

    const firstMsg = await queryOne(
      "SELECT MIN(timestamp) as first_msg_time FROM wa_messages WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0",
      [sessionId, chatJid]
    );

    await query(`
      INSERT INTO lead_analysis (session_id, chat_jid, contact_name, category, first_chat_time, detected_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        contact_name = VALUES(contact_name),
        detected_at = VALUES(detected_at),
        notes = VALUES(notes)
    `, [sessionId, chatJid, contactName, category, firstMsg?.first_msg_time || toMySQLDatetime(), toMySQLDatetime(), notes || null]);

    console.log(`[LeadAnalysis] Saved ${category} for ${contactName}`);
  } catch (err) {
    console.error(`[LeadAnalysis] Error saving ${category}:`, err.message);
  }
}

export async function computeBadLeads(sessionId = null) {
  try {
    const sessionFilter = sessionId ? "AND m.session_id = ?" : "";
    const params = sessionId ? [sessionId] : [];

    const badCandidates = await query(`
      SELECT m.session_id, m.chat_jid, m.timestamp as template_sent_at
      FROM wa_messages m
      WHERE m.is_from_me = 1
        AND m.chat_jid NOT LIKE '%@g.us'
        AND m.chat_jid NOT LIKE '%@newsletter'
        AND (
          LOWER(m.content) LIKE '%baik ka%akan membantu%'
          OR (LOWER(m.content) LIKE '%nama%usia%asal kota%pendidikan%minat kerja%')
          OR (LOWER(m.content) LIKE '%boleh dibantu isi data%')
        )
        ${sessionFilter}
      ORDER BY m.session_id, m.chat_jid, m.timestamp DESC
    `, params);

    const templateMap = new Map();
    badCandidates.forEach(c => {
      const key = `${c.session_id}-${c.chat_jid}`;
      if (!templateMap.has(key) || new Date(c.template_sent_at) > new Date(templateMap.get(key).template_sent_at)) {
        templateMap.set(key, c);
      }
    });

    let count = 0;
    for (const [, c] of templateMap) {
      const templateTime = new Date(c.template_sent_at);
      const now = new Date();
      const hoursSinceTemplate = (now - templateTime) / (1000 * 60 * 60);

      const lastLeadMsg = await queryOne(`
        SELECT MAX(timestamp) as last_reply
        FROM wa_messages
        WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0 AND timestamp > ?
      `, [c.session_id, c.chat_jid, c.template_sent_at]);

      const hasReply = lastLeadMsg && lastLeadMsg.last_reply;

      if (hoursSinceTemplate >= 1 && !hasReply) {
        const contact = await queryOne(
          "SELECT name, push_name FROM wa_contacts WHERE session_id = ? AND jid = ?",
          [c.session_id, c.chat_jid]
        );
        const contactName = contact?.name || contact?.push_name || c.chat_jid.split('@')[0] || 'Unknown';

        const firstMsg = await queryOne(
          "SELECT MIN(timestamp) as first_msg_time FROM wa_messages WHERE session_id = ? AND chat_jid = ? AND is_from_me = 0",
          [c.session_id, c.chat_jid]
        );

        await query(`
          INSERT INTO lead_analysis (session_id, chat_jid, contact_name, category, first_chat_time, detected_at, notes)
          VALUES (?, ?, ?, 'bad', ?, ?, 'Tidak balas setelah dikirim template data diri')
          ON DUPLICATE KEY UPDATE
            contact_name = VALUES(contact_name),
            detected_at = VALUES(detected_at),
            notes = VALUES(notes)
        `, [c.session_id, c.chat_jid, contactName, firstMsg?.first_msg_time || c.template_sent_at, toMySQLDatetime()]);

        count++;
      }
    }
    return count;
  } catch (err) {
    console.error("[LeadAnalysis] Error computing bad leads:", err.message);
    return 0;
  }
}

export async function getLeadAnalysis(sessionId = null, period = "Minggu") {
  let dateFilter = "";
  let params = [];

  if (sessionId) {
    params.push(sessionId);
  }

  switch (period) {
    case "Hari ini":
      dateFilter = "AND DATE(la.detected_at) = CURDATE()";
      break;
    case "Kemarin":
      dateFilter = "AND DATE(la.detected_at) = SUBDATE(CURDATE(), 1)";
      break;
    case "Minggu":
      dateFilter = "AND la.detected_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
      break;
    case "Bulan":
      dateFilter = "AND la.detected_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
      break;
    default:
      dateFilter = "AND DATE(la.detected_at) = CURDATE()";
  }

  const sessionFilter = sessionId ? "AND la.session_id = ?" : "";

  const data = await query(`
    SELECT la.*, ws.name as session_name
    FROM lead_analysis la
    JOIN wa_sessions ws ON la.session_id = ws.id
    WHERE 1=1
      ${sessionFilter}
      ${dateFilter}
    ORDER BY la.detected_at DESC
  `, params);

  const categories = await getAllCategories();
  const catKeys = categories.map(c => c.name);

  const summary = { total: data.length };
  catKeys.forEach(c => summary[c] = data.filter(d => d.category === c).length);

  return { data, summary };
}

export async function detectKendalaFromText(sessionId, chatJid, text) {
  if (!text) return null;
  const categories = await getAllCategories();
  for (const cat of categories) {
    const keywords = typeof cat.keywords === "string" ? JSON.parse(cat.keywords) : (cat.keywords || []);
    if (matchKeywords(text, keywords)) {
      console.log(`[Kendala] → TERDETEKSI: ${cat.name} (keyword match di "${text.slice(0, 60)}")`);
      await saveKendala(sessionId, chatJid, cat.name, `Admin membalas terkait ${cat.label}`);
      return cat.name;
    }
  }
  return null;
}
