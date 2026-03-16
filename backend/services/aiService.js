import OpenAI from "openai";
import { queryOne } from "../db.js";


const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // Ambil dari file .env
  baseURL: "https://api.groq.com/openai/v1",
});
// Tracker Global untuk membatalkan antrean jika admin balas manual
const aiQueues = {};

/**
 * Handle Auto-Reply dengan fitur INTERUPSI MANUSIA
 */
export const handleAIResponse = async (
  sessionId,
  remoteJid,
  userMessage,
  sock,
  isFromMe,
) => {
  try {
    // --- LOGIKA STOP AI (INTERUPSI) ---
    // Jika pesan terdeteksi dari Admin (isFromMe = true)
    if (isFromMe) {
      if (aiQueues[remoteJid]) {
        console.log(
          `[STOP-AI] Admin membalas manual ke ${remoteJid}. Membatalkan AI...`,
        );
        clearTimeout(aiQueues[remoteJid].timeoutId); // Hentikan timer
        delete aiQueues[remoteJid]; // Hapus dari antrean
      }
      return; // Keluar, jangan biarkan AI membalas dirinya sendiri
    }

    // 1. Ambil Settingan dari DB
    const settings = await queryOne(
      `SELECT 
        is_active, bot_name, prompt, knowledge_base, 
        min_delay, max_delay, human_wait_time 
       FROM wa_ai_settings WHERE session_id = ?`,
      [sessionId],
    );

    // Validasi Dasar
    if (!settings || Number(settings.is_active) !== 1) return;
    if (!settings.knowledge_base) return;

    // --- LOGIKA RESET ANTREAN ---
    // Jika user chat berkali-kali saat AI masih "menunggu", reset timernya
    if (aiQueues[remoteJid]) {
      clearTimeout(aiQueues[remoteJid].timeoutId);
    }

    // Konversi Waktu
    const waitTimeMs = (settings.human_wait_time || 0) * 60 * 1000;
    const minDelayMs = (settings.min_delay || 5) * 1000;
    const maxDelayMs = (settings.max_delay || 15) * 1000;

    // Fungsi Internal yang akan dieksekusi setelah waktu tunggu selesai
    const executeAIProcess = async () => {
      try {
        // Hapus dari tracker karena proses sudah dimulai
        delete aiQueues[remoteJid];

        // Indikasi Mengetik
        await sock.sendPresenceUpdate("composing", remoteJid);

        // Request ke Groq Cloud
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Nama: ${settings.bot_name}. Instruksi: ${settings.prompt}. Materi: ${settings.knowledge_base}. Aturan: Jawab hanya berdasarkan materi. Jika tidak ada, arahkan ke admin.`,
            },
            { role: "user", content: userMessage },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.4,
          max_tokens: 512,
        });

        const aiReply = completion.choices[0]?.message?.content;
        if (!aiReply) return;

        // Jeda Mengetik Random
        const randomTypingDelay = Math.floor(
          Math.random() * (maxDelayMs - minDelayMs + 1) + minDelayMs,
        );

        setTimeout(async () => {
          await sock.sendMessage(remoteJid, { text: aiReply });
          await sock.sendPresenceUpdate("paused", remoteJid);
          console.log(`✅ AI Berhasil menjawab ${remoteJid} setelah jeda.`);
        }, randomTypingDelay);
      } catch (err) {
        console.error("❌ Error AI Execution:", err.message);
      }
    };

    // --- DAFTARKAN KE ANTREAN ---
    if (waitTimeMs > 0) {
      console.log(
        `[QUEUED] Menunggu ${settings.human_wait_time} menit sebelum AI menjawab ${remoteJid}...`,
      );
    }

    aiQueues[remoteJid] = {
      timeoutId: setTimeout(executeAIProcess, waitTimeMs),
    };
  } catch (error) {
    console.error("❌ Error handleAIResponse:", error.message);
    await sock.sendPresenceUpdate("paused", remoteJid).catch(() => {});
  }
};
