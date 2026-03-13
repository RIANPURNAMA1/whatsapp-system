import { GoogleGenAI } from "@google/genai";
import { queryOne } from "../db.js"

// Inisialisasi AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Handle Auto-Reply menggunakan library @google/genai
 */
export const handleAIResponse = async (sessionId, remoteJid, userMessage, sock) => {
  try {
    // 1. Ambil settingan bot dari database
    const settings = await queryOne(
      "SELECT bot_name, prompt, knowledge_base, min_delay, max_delay FROM wa_ai_settings WHERE session_id = ?",
      [sessionId]
    );

    // Filter: Jika tidak ada setting atau knowledge base kosong, abaikan
    if (!settings || !settings.knowledge_base) return;

    const botName = settings.bot_name || "Asisten Digital";
    const instruction = settings.prompt || "Jawab dengan ramah.";
    const knowledge = settings.knowledge_base;

    // 2. Beri indikasi "sedang mengetik"
    await sock.sendPresenceUpdate("composing", remoteJid);

    // 3. Eksekusi AI
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Identitas Anda: ${botName}
        Instruksi: ${instruction}
        
        Gunakan Pengetahuan Berikut:
        ---
        ${knowledge}
        ---

        Pertanyaan: "${userMessage}"

        Aturan:
        - Jika jawaban ada di materi, jelaskan dengan baik.
        - Jika tidak ada, arahkan ke admin secara sopan.
      `,
    });

    const aiReply = response.text;
    if (!aiReply) {
      await sock.sendPresenceUpdate("paused", remoteJid);
      return;
    }

    // 4. Kalkulasi Delay (Anti-Ban)
    const min = settings.min_delay || 5;
    const max = settings.max_delay || 15;
    const randomDelay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;

    console.log(`[AI-REPLY] Jeda ${randomDelay / 1000}s untuk ${remoteJid}`);

    // 5. Kirim dengan Delay
    setTimeout(async () => {
      try {
        await sock.sendMessage(remoteJid, { text: aiReply });
        await sock.sendPresenceUpdate("paused", remoteJid);
        console.log(`✅ AI Berhasil membalas ${remoteJid}`);
      } catch (err) {
        console.error("❌ Gagal kirim pesan AI:", err.message);
      }
    }, randomDelay);

  } catch (error) {
    console.error("❌ Error handleAIResponse:", error.message);
    await sock.sendPresenceUpdate("paused", remoteJid).catch(() => {});
  }
};