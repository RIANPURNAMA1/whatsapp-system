import path from "path";
import fs from "fs";
import { query } from "../db.js";

export const checkAndSendRules = async (sessionId, remoteJid, userMessage, sock) => {
  try {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    const allRules = await query(
      `SELECT keyword, answer, image_url FROM wa_rules WHERE session_id = ?`,
      [sessionId]
    );

    if (!allRules || allRules.length === 0) return false;

    const ruleMatch = allRules.find(rule => {
      const kw = rule.keyword.toLowerCase().trim();
      return lowerMessage.includes(kw);
    });

    if (ruleMatch) {
      console.log(`[RULE-HIT] Keyword: "${ruleMatch.keyword}"`);
      await sock.sendPresenceUpdate("composing", remoteJid);

      if (ruleMatch.image_url) {
        // --- PERBAIKAN PATH DI SINI ---
        // Karena di server.js kamu pakai app.use("/uploads", express.static("uploads"))
        // Kita ambil path relatifnya saja dari database
        
        // Asumsi image_url di DB adalah: http://localhost:3001/uploads/rules/namafile.jpg
        // Kita butuh mengambil: uploads/rules/namafile.jpg
        const relativePath = ruleMatch.image_url.split('3001/')[1] || ruleMatch.image_url;
        const filePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(filePath)) {
          console.log(`[RULE-SEND] Mengirim file: ${filePath}`);
          await sock.sendMessage(remoteJid, { 
            // Menggunakan Buffer (fs.readFileSync) jauh lebih stabil daripada { url } untuk file lokal
            image: fs.readFileSync(filePath), 
            caption: ruleMatch.answer 
          });
        } else {
          console.error(`[RULE-ERROR] File fisik tidak ada di: ${filePath}`);
          await sock.sendMessage(remoteJid, { text: ruleMatch.answer });
        }
      } else {
        await sock.sendMessage(remoteJid, { text: ruleMatch.answer });
      }

      await sock.sendPresenceUpdate("paused", remoteJid);
      return true; 
    }

    return false;
  } catch (error) {
    console.error("❌ Error di ruleService:", error.message);
    return false;
  }
};