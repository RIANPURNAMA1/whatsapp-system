import OpenAI from "openai";
import { queryOne, query } from "../db.js";
import { checkAndSendRules } from "./ruleService.js";
import path from "path";
import fs from "fs";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const aiQueues = {};

export const handleAIResponse = async (sessionId, remoteJid, userMessage, sock, isFromMe) => {
  try {
    if (isFromMe) {
      if (aiQueues[remoteJid]) {
        clearTimeout(aiQueues[remoteJid].timeoutId);
        clearTimeout(aiQueues[remoteJid].typingTimeoutId);
        delete aiQueues[remoteJid];
      }
      return; 
    }

    // 1. AMBIL SETTINGAN
    const settings = await queryOne(
      `SELECT is_active, is_rules_active, bot_name, prompt, knowledge_base, min_delay, max_delay, human_wait_time 
       FROM wa_ai_settings WHERE session_id = ?`,
      [sessionId],
    );

    if (!settings) return;

    // --- PERBAIKAN DI SINI ---
    // 2. LOGIKA RULES (Dijalankan lebih dulu tanpa terhalang status is_active AI)
    if (Number(settings.is_rules_active) === 1) {
      const isRuleSent = await checkAndSendRules(sessionId, remoteJid, userMessage, sock);
      
      if (isRuleSent) {
        if (aiQueues[remoteJid]) {
          clearTimeout(aiQueues[remoteJid].timeoutId);
          clearTimeout(aiQueues[remoteJid].typingTimeoutId);
          delete aiQueues[remoteJid];
        }
        return; 
      }
    }

    // 3. CEK STATUS ACTIVE AI
    // Sekarang, jika AI mati, Rules tetap bisa membalas di atas.
    if (Number(settings.is_active) !== 1) return;

    // 4. LOGIKA ANTREAN AI
    if (aiQueues[remoteJid]) {
        aiQueues[remoteJid].messages.push(userMessage);
        return; 
    }

    const executeAIProcess = async (currentSettings) => {
      try {
        if (!aiQueues[remoteJid]) return;
        aiQueues[remoteJid].isProcessing = true;

        await sock.sendPresenceUpdate("composing", remoteJid);
        const fullUserContent = aiQueues[remoteJid].messages.join(" ");

        const availableAssets = await query(
          "SELECT asset_name FROM wa_ai_media_assets WHERE session_id = ?",
          [sessionId]
        );
        const assetListString = availableAssets.map(a => `[[${a.asset_name}]]`).join(", ");

        const completion = await groq.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: `Nama Bot: ${currentSettings.bot_name}. 
              Instruksi: ${currentSettings.prompt}. 
              Materi Pengetahuan: ${currentSettings.knowledge_base}. 
              Aset Gambar Tersedia: ${assetListString}.
              Jika user bertanya tentang hal yang berkaitan dengan aset di atas, kirimkan tag-nya dalam jawabanmu.` 
            },
            { role: "user", content: fullUserContent },
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
        });

        let aiReply = completion.choices[0]?.message?.content;
        if (!aiReply || !aiQueues[remoteJid]) return;

        const minDelay = (currentSettings.min_delay || 5) * 1000;
        const maxDelay = (currentSettings.max_delay || 15) * 1000;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);

        aiQueues[remoteJid].typingTimeoutId = setTimeout(async () => {
          if (aiQueues[remoteJid]) {
            const tagRegex = /\[\[(.*?)\]\]/g;
            const match = tagRegex.exec(aiReply);

            if (match) {
              const assetName = match[1].trim().toLowerCase();
              const cleanText = aiReply.replace(match[0], "").trim();

              const asset = await queryOne(
                "SELECT file_path FROM wa_ai_media_assets WHERE session_id = ? AND asset_name = ?",
                [sessionId, assetName]
              );

              if (asset) {
                await sock.sendMessage(remoteJid, { 
                  image: { url: asset.file_path }, 
                  caption: cleanText 
                });
              } else {
                await sock.sendMessage(remoteJid, { text: cleanText });
              }
            } else {
              await sock.sendMessage(remoteJid, { text: aiReply });
            }

            await sock.sendPresenceUpdate("paused", remoteJid);
            delete aiQueues[remoteJid];
          }
        }, randomDelay);

      } catch (err) {
        console.error("❌ Groq AI Error:", err.message);
        delete aiQueues[remoteJid];
      }
    };

    const waitTimeMs = (settings.human_wait_time || 0) * 60 * 1000;
    aiQueues[remoteJid] = {
      messages: [userMessage],
      timeoutId: setTimeout(() => executeAIProcess(settings), waitTimeMs),
      typingTimeoutId: null,
      isProcessing: false
    };

  } catch (error) {
    console.error("❌ Fatal Error in handleAIResponse:", error.message);
  }
};
// import { GoogleGenAI } from "@google/genai";
// import { queryOne } from "../db.js";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// // Tracker Global untuk membatalkan antrean jika admin balas manual
// const aiQueues = {};

// /**
//  * Handle Auto-Reply dengan fitur INTERUPSI MANUSIA
//  */
// export const handleAIResponse = async (
//   sessionId,
//   remoteJid,
//   userMessage,
//   sock,
//   isFromMe,
// ) => {
//   try {
//     // --- STOP AI JIKA ADMIN BALAS ---
//     if (isFromMe) {
//       if (aiQueues[remoteJid]) {
//         console.log(
//           `[STOP-AI] Admin membalas manual ke ${remoteJid}. Membatalkan AI...`,
//         );
//         clearTimeout(aiQueues[remoteJid].timeoutId);
//         delete aiQueues[remoteJid];
//       }
//       return;
//     }

//     // Ambil setting dari database
//     const settings = await queryOne(
//       `SELECT 
//         is_active, bot_name, prompt, knowledge_base, 
//         min_delay, max_delay, human_wait_time 
//        FROM wa_ai_settings WHERE session_id = ?`,
//       [sessionId],
//     );

//     if (!settings || Number(settings.is_active) !== 1) return;
//     if (!settings.knowledge_base) return;

//     // Reset antrean jika user spam chat
//     if (aiQueues[remoteJid]) {
//       clearTimeout(aiQueues[remoteJid].timeoutId);
//     }

//     // Konversi waktu
//     const waitTimeMs = (settings.human_wait_time || 0) * 60 * 1000;
//     const minDelayMs = (settings.min_delay || 5) * 1000;
//     const maxDelayMs = (settings.max_delay || 15) * 1000;

//     // Fungsi AI setelah delay
//     const executeAIProcess = async () => {
//       try {
//         delete aiQueues[remoteJid];

//         await sock.sendPresenceUpdate("composing", remoteJid);

//         const systemPrompt = `
// Nama Bot: ${settings.bot_name}

// Instruksi:
// ${settings.prompt}

// Materi Pengetahuan:
// ${settings.knowledge_base}

// Aturan:
// - Jawab hanya berdasarkan materi.
// - Jika tidak ditemukan jawabannya arahkan user ke admin.
// `;

//         // Request ke Gemini
//         const response = await ai.models.generateContent({
//           model: "gemini-2.5-flash",
//           contents: `${systemPrompt}\n\nPertanyaan User: ${userMessage}`,
//         });

//         const aiReply = response.text;

//         if (!aiReply) return;

//         const randomTypingDelay = Math.floor(
//           Math.random() * (maxDelayMs - minDelayMs + 1) + minDelayMs,
//         );

//         setTimeout(async () => {
//           await sock.sendMessage(remoteJid, { text: aiReply });
//           await sock.sendPresenceUpdate("paused", remoteJid);

//           console.log(`✅ AI menjawab ${remoteJid}`);
//         }, randomTypingDelay);
//       } catch (err) {
//         console.error("❌ Error AI Execution:", err.message);
//       }
//     };

//     if (waitTimeMs > 0) {
//       console.log(
//         `[QUEUED] Menunggu ${settings.human_wait_time} menit sebelum AI menjawab ${remoteJid}`,
//       );
//     }

//     aiQueues[remoteJid] = {
//       timeoutId: setTimeout(executeAIProcess, waitTimeMs),
//     };
//   } catch (error) {
//     console.error("❌ Error handleAIResponse:", error.message);
//     await sock.sendPresenceUpdate("paused", remoteJid).catch(() => {});
//   }
// };