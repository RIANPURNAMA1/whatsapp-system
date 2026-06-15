import { query, queryOne } from "../db.js";

function toMySQLDatetime(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function saveClosingEvent(sessionId, chatJid, closingTime, source) {
  try {
    const firstMsg = await queryOne(`
      SELECT MIN(timestamp) as first_msg_time
      FROM wa_messages
      WHERE session_id = ? AND chat_jid = ?
    `, [sessionId, chatJid]);

    const jidVariants = [chatJid, chatJid.includes('@') ? chatJid : chatJid + '@s.whatsapp.net', chatJid.replace(/@.*$/, '')];
    let contact = null;
    for (const jv of jidVariants) {
      contact = await queryOne(`SELECT name, push_name FROM wa_contacts WHERE session_id = ? AND jid = ?`, [sessionId, jv]);
      if (contact?.name || contact?.push_name) break;
    }

    const contactName = contact?.name || contact?.push_name || chatJid.replace(/@.*$/, '') || 'Unknown';
    const firstChatTime = firstMsg?.first_msg_time || closingTime;

    const durasiMs = new Date(closingTime) - new Date(firstChatTime);
    const durasiJam = Math.max(0, Math.round(durasiMs / (1000 * 60 * 60) * 100) / 100);

    await query(`
      INSERT INTO closing_traffic (session_id, chat_jid, contact_name, first_chat_time, closing_time, durasi_jam, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        contact_name = VALUES(contact_name),
        first_chat_time = VALUES(first_chat_time),
        closing_time = VALUES(closing_time),
        durasi_jam = TIMESTAMPDIFF(HOUR, VALUES(first_chat_time), VALUES(closing_time)),
        source = VALUES(source)
    `, [sessionId, chatJid, contactName, toMySQLDatetime(firstChatTime), toMySQLDatetime(closingTime), durasiJam, source]);

    console.log(`[ClosingTraffic] Saved: ${contactName} (${sessionId}) via ${source}`);
  } catch (err) {
    console.error("[ClosingTraffic] Error saving:", err.message);
  }
}
