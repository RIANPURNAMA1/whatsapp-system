import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { queryOne, query } from "../db.js";
import { checkAndSendRules } from "./ruleService.js";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const aiQueues = {};

// ─── Helper: deteksi error token habis dari Groq ───────────────────────────
const isTokenLimitError = (err) => {
  const msg = err?.message?.toLowerCase() || "";
  const status = err?.status || err?.response?.status;
  return (
    status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("token") ||
    msg.includes("exceeded") ||
    msg.includes("limit reached")
  );
};

// ─── Helper: panggil Groq ───────────────────────────────────────────────────
const callGroq = async (systemPrompt, userMessage) => {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
  });
  return completion.choices[0]?.message?.content;
};

// ─── Helper: panggil Gemini ─────────────────────────────────────────────────
const callGemini = async (systemPrompt, userMessage) => {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${systemPrompt}\n\nPertanyaan User: ${userMessage}`,
  });
  return response.text;
};

// ─── Helper: panggil AI dengan fallback ────────────────────────────────────
const callAIWithFallback = async (systemPrompt, userMessage) => {
  try {
    console.log("[AI] Mencoba Groq...");
    const reply = await callGroq(systemPrompt, userMessage);
    console.log("[AI] ✅ Groq berhasil.");
    return { reply, provider: "groq" };
  } catch (err) {
    if (isTokenLimitError(err)) {
      console.warn("[AI] ⚠️ Groq token/quota habis. Switch ke Gemini...");
      try {
        const reply = await callGemini(systemPrompt, userMessage);
        console.log("[AI] ✅ Gemini berhasil (fallback).");
        return { reply, provider: "gemini" };
      } catch (geminiErr) {
        console.error("[AI] ❌ Gemini juga gagal:", geminiErr.message);
        throw geminiErr;
      }
    }
    throw err;
  }
};

// ─── Main Handler ───────────────────────────────────────────────────────────
export const handleAIResponse = async (
  sessionId,
  remoteJid,
  userMessage,
  sock,
  isFromMe,
) => {
  try {
    // 1. Stop AI jika admin balas manual
    if (isFromMe) {
      if (aiQueues[remoteJid]) {
        clearTimeout(aiQueues[remoteJid].timeoutId);
        clearTimeout(aiQueues[remoteJid].typingTimeoutId);
        delete aiQueues[remoteJid];
      }
      return;
    }

    // 2. Ambil settings
    const settings = await queryOne(
      `SELECT is_active, is_rules_active, bot_name, prompt, knowledge_base, 
              min_delay, max_delay, human_wait_time 
       FROM wa_ai_settings WHERE session_id = ?`,
      [sessionId],
    );
    if (!settings) return;

    // 3. Cek & kirim Rules lebih dulu (tidak terhalang is_active)
    if (Number(settings.is_rules_active) === 1) {
      const isRuleSent = await checkAndSendRules(
        sessionId,
        remoteJid,
        userMessage,
        sock,
      );
      if (isRuleSent) {
        if (aiQueues[remoteJid]) {
          clearTimeout(aiQueues[remoteJid].timeoutId);
          clearTimeout(aiQueues[remoteJid].typingTimeoutId);
          delete aiQueues[remoteJid];
        }
        return;
      }
    }

    // 4. Cek status AI aktif
    if (Number(settings.is_active) !== 1) return;

    // 5. Antrean pesan (jika user spam)
    if (aiQueues[remoteJid]) {
      aiQueues[remoteJid].messages.push(userMessage);
      return;
    }

    // 6. Eksekusi AI
    // 6. Eksekusi AI (Ganti bagian ini saja)
    const executeAIProcess = async (currentSettings) => {
      try {
        if (!aiQueues[remoteJid]) return;
        aiQueues[remoteJid].isProcessing = true;

        await sock.sendPresenceUpdate("composing", remoteJid);
        const fullUserContent = aiQueues[remoteJid].messages.join(" ");

        // Ambil daftar aset media untuk prompt AI
        const availableAssets = await query(
          "SELECT asset_name FROM wa_ai_media_assets WHERE session_id = ?",
          [sessionId],
        );
        const assetListString = availableAssets
          .map((a) => `[[${a.asset_name}]]`)
          .join(", ");

        const systemPrompt = `
          Nama Bot: ${currentSettings.bot_name}
          Instruksi: ${currentSettings.prompt}
          Materi: ${currentSettings.knowledge_base}
          Aset Gambar: ${assetListString}
          Gunakan tag [[nama_aset]] jika relevan dengan pertanyaan user.
          Jawab singkat, padat, dan ramah. Jika tidak ada di materi, arahkan ke admin.
        `.trim();

        // Panggil AI dengan Fallback (Groq -> Gemini)
        const { reply: aiReply, provider } = await callAIWithFallback(
          systemPrompt,
          fullUserContent,
        );

        if (!aiReply || !aiQueues[remoteJid]) return;

        // Delay simulasi mengetik (random antara min_delay & max_delay)
        const minD = (currentSettings.min_delay || 3) * 1000;
        const maxD = (currentSettings.max_delay || 7) * 1000;
        const randomDelay = Math.floor(
          Math.random() * (maxD - minD + 1) + minD,
        );

        aiQueues[remoteJid].typingTimeoutId = setTimeout(async () => {
          if (!aiQueues[remoteJid]) return;

          let sentMsg;
          const tagRegex = /\[\[(.*?)\]\]/g;
          const match = tagRegex.exec(aiReply);

          // --- 1. PROSES KIRIM KE WHATSAPP ---
          if (match) {
            const assetName = match[1].trim().toLowerCase();
            const cleanText = aiReply.replace(match[0], "").trim();
            const asset = await queryOne(
              "SELECT file_path FROM wa_ai_media_assets WHERE session_id = ? AND asset_name = ?",
              [sessionId, assetName],
            );

            if (asset) {
              sentMsg = await sock.sendMessage(remoteJid, {
                image: { url: asset.file_path },
                caption: cleanText,
              });
            } else {
              sentMsg = await sock.sendMessage(remoteJid, { text: cleanText });
            }
          } else {
            sentMsg = await sock.sendMessage(remoteJid, { text: aiReply });
          }

          // --- 2. PROSES SIMPAN KE DATABASE (Agar muncul di Dashboard) ---
          // --- PROSES SIMPAN KE DATABASE (wa_messages) ---
          try {
            // Gunakan format YYYY-MM-DD HH:mm:ss sesuai waktu lokal server
            const sekarang = new Date();
            const offset = sekarang.getTimezoneOffset() * 60000;
            const localISOTime = new Date(sekarang - offset)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");

            await query(
              `INSERT INTO wa_messages (
      session_id, 
      message_id, 
      chat_jid, 
      from_jid, 
      is_from_me, 
      message_type, 
      content, 
      status, 
      timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sessionId,
                sentMsg.key.id,
                remoteJid,
                sessionId,
                1,
                "conversation",
                aiReply,
                "delivered",
                localISOTime, // Gunakan variabel localISOTime di sini
              ],
            );
            console.log(
              `[AI] ✅ Berhasil membalas & mencatat waktu: ${localISOTime}`,
            );
          } catch (dbErr) {
            console.error("❌ Gagal simpan record AI ke DB:", dbErr.message);
          }

          await sock.sendPresenceUpdate("paused", remoteJid);
          delete aiQueues[remoteJid];
        }, randomDelay);
      } catch (err) {
        console.error("❌ Error Eksekusi AI:", err.message);
        delete aiQueues[remoteJid];
      }
    };

    // 7. Daftarkan ke antrean dengan human_wait_time
    const waitTimeMs = (settings.human_wait_time || 0) * 60 * 1000;
    aiQueues[remoteJid] = {
      messages: [userMessage],
      timeoutId: setTimeout(() => executeAIProcess(settings), waitTimeMs),
      typingTimeoutId: null,
      isProcessing: false,
    };
  } catch (error) {
    console.error("❌ Fatal Error in handleAIResponse:", error.message);
  }
};
// ```

// ---

// ## Cara Kerja Fallback
// ```
// User kirim pesan
//        ↓
//   Coba Groq dulu
//        ↓
//   Groq error? → cek apakah error rate limit/quota/token
//        ↓ Ya
//   Switch ke Gemini otomatis
//        ↓
//   Gemini juga gagal? → log error, batalkan antrean
