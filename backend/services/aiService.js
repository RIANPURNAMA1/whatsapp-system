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
    // 1. Ambil settingan bot dari database (WAJIB masukkan is_active di SELECT)
    const settings = await queryOne(
      "SELECT is_active, bot_name, prompt, knowledge_base, min_delay, max_delay FROM wa_ai_settings WHERE session_id = ?",
      [sessionId]
    );

    // Filter 1: Jika tidak ada data di database sama sekali
    if (!settings) return;

    /**
     * Filter 2: CEK STATUS AKTIF (CS AI TOGGLE)
     * Jika di database is_active = 0, maka bot harus berhenti (return)
     */
    if (Number(settings.is_active) !== 1) {
      console.log(`[AI-SKIP] Session ${sessionId} status: OFFLINE. Mengabaikan pesan.`);
      return;
    }

    // Filter 3: Jika knowledge base kosong, abaikan
    if (!settings.knowledge_base) {
      console.log(`[AI-SKIP] Knowledge base untuk ${sessionId} kosong.`);
      return;
    }

    const botName = settings.bot_name || "Asisten Digital";
    const instruction = settings.prompt || "Jawab dengan ramah.";
    const knowledge = settings.knowledge_base;

    // 2. Beri indikasi "sedang mengetik"
    await sock.sendPresenceUpdate("composing", remoteJid);

    // 3. Eksekusi AI sesuai model Anda
    // Menggunakan struktur response.text sesuai kode awal Anda
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Disarankan ganti ke flash jika preview bermasalah
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

    // Pastikan cara mengambil teks sesuai dengan versi library Anda
    const aiReply = result.text || (result.response && result.response.text ? result.response.text() : null);

    if (!aiReply) {
      console.log(`[AI-EMPTY] Tidak ada balasan yang dihasilkan.`);
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
        console.log(`✅ AI Berhasil membalas ${remoteJid} (Status: Online)`);
      } catch (err) {
        console.error("❌ Gagal kirim pesan AI:", err.message);
      }
    }, randomDelay);

  } catch (error) {
    console.error("❌ Error handleAIResponse:", error.message);
    await sock.sendPresenceUpdate("paused", remoteJid).catch(() => {});
  }
};