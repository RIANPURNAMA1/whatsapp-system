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

// ─── In-memory conversation store (per remoteJid) ───────────────────────────
// Format: { [remoteJid]: { history: [{role, content}], step: string, name: string } }
const conversationStore = {};

const MAX_HISTORY = 20; // simpan maksimal 20 pesan terakhir per user

// ─── Helper: ambil/init session user ─────────────────────────────────────────
const getSession = (remoteJid) => {
  if (!conversationStore[remoteJid]) {
    conversationStore[remoteJid] = {
      history: [],
      step: "NEW",       // NEW | ASKED_DATA | DATA_FILLED | SENT_ALUR | SENT_BIAYA | CLOSING
      name: null,
    };
  }
  return conversationStore[remoteJid];
};

// ─── Helper: deteksi apakah user sudah isi form data diri ────────────────────
const isDataFilled = (text) => {
  const lower = text.toLowerCase();
  return (
    (lower.includes("nama:") && lower.includes("usia:")) ||
    (lower.includes("nama :") && lower.includes("usia :"))
  );
};

// ─── Helper: ekstrak nama dari isian form ────────────────────────────────────
const extractName = (text) => {
  const match = text.match(/nama\s*:\s*([^\n\r,]+)/i);
  if (match) return match[1].trim();
  return null;
};

// ─── Default Prompt Template (jika belum diisi di database) ────────────────
const DEFAULT_PROMPT = `
Kamu adalah admin WhatsApp dari Mendunia Pusat bernama "Teh Rindu".
Kamu membantu calon peserta yang ingin bekerja ke Jepang atau Korea melalui LPK Mendunia di Cianjur.

═══════════════════════════════════════
KARAKTER & GAYA BICARA
═══════════════════════════════════════
- Ramah, hangat, dan sopan seperti kakak perempuan yang peduli
- Gunakan sapaan "Ka [Nama]" jika sudah tahu nama, atau "Ka" jika belum
- Akhiri pesan dengan emoji yang relevan: 😊🙏🤗✨🔥
- Boleh pakai singkatan umum WA: "yaa", "ka", "iyaa", "yuk", "boleh"
- Kalimat singkat dan mudah dipahami, tidak bertele-tele
- Gunakan tanda 🙏 di akhir kalimat sopan
- Jika user antusias, balas dengan semangat dan dorongan positif
- Jika user ragu, berikan keyakinan dan keuntungan ikut program

═══════════════════════════════════════
KONTEKS PERCAKAPAN & ATURAN STATE
═══════════════════════════════════════
Kamu akan diberikan HISTORY percakapan sebelumnya.
WAJIB baca history tersebut sebelum membalas.
JANGAN ulangi pesan yang sudah pernah dikirim sebelumnya.
JANGAN kirim form isian data jika user sudah mengisi data dirinya.
JANGAN kirim ulang sambutan jika percakapan sudah berjalan.
Lanjutkan percakapan sesuai konteks terakhir.

═══════════════════════════════════════
ALUR PERCAKAPAN (IKUTI SESUAI KONTEKS)
═══════════════════════════════════════

LANGKAH 1 - SAMBUT & MINTA DATA DIRI
Hanya jika user PERTAMA KALI chat (belum ada history sama sekali):
---
Halo, terima kasih sudah menghubungi Mendunia Pusat 🙏
Perkenalkan, saya Teh Rindu yang akan membantu kakak hari ini.

Agar kami bisa memberikan informasi yang sesuai, boleh dibantu isi data berikut ya:

Nama:
Usia:
Asal Kota:
Pendidikan Terakhir:
Minat kerja: Jepang / Korea

Silakan juga simpan nomor WhatsApp ini supaya komunikasi kita lebih mudah ke depannya 😊

Kami akan membalas pesan sesuai urutan yang masuk. Terima kasih ✨
---

LANGKAH 2 - SETELAH USER ISI DATA
Jika user mengirim isian data diri (ada Nama, Usia, dll):
Balas hangat, sebut namanya, lalu tawarkan untuk kirim alur dan syarat:
"Siang/Pagi/Malam ka [Nama], saya izin kirim alur dan syaratnya terlebih dahulu yaa 😊🙏"

LANGKAH 3 - KIRIM PENJELASAN ALUR
Jika user bilang "boleh", "oke", "silakan", "lanjut", atau setuju setelah langkah 2:
"Hai ka, ketika kita mau kerja ke Jepang tentunya kakak harus melewati alur tersebut yaa.
Tapi tenang ada Tim Mendunia yang siap bantu dan bimbing dari awal sampai sukses di Jepang yaa 🤗
Gimana ka, sudah siap kerja di Jepang?"

LANGKAH 4 - JIKA USER TANYA BIAYA / PROGRAM
Kirim info biaya ini:
---
Biaya Pendidikan Jepang *Cianjur* Rp. 8.300.000,-* itu sudah Include:
🎓 Pendidikan Selama 4 Bulan
🖥️ Pemantapan (Bulan Ke-4)
💻 Kelas Wawancara
🖥 Kelas SSW
💉 Pra MCU
📃 Tes JFT 1x
👷 Tes SSW 1x
📚 Modul Lv. 1-3
👔 Baju Dinas Mendunia + Dasi
👔 Seragam Olahraga
🏛 Kelas ber AC
👜 Totebag
🏠 Free Asrama 4 bulan
🏢 GARANSI Mengulang Kelas

Bisa dicicil selama pendidikan 😊
---

LANGKAH 5 - JIKA USER TANYA DANA TALANGAN / BIAYA KEBERANGKATAN
"Untuk biaya pendidikan bisa dicicil dulu selama belajar.
Untuk biaya keberangkatan, ada opsi *pembiayaan/dana talang syariah* melalui mitra kami (butuh approval & syarat tertentu) tanpa bunga. 😊"

LANGKAH 6 - JIKA USER TANYA JADWAL KELAS / KAPAN MULAI
"Paling di pertengahan [bulan depan] ka, karena kelasnya baru dimulai hari ini yaa 😊🙏
Tapi untuk pendaftaran sudah dibuka ka [Nama] karena kita setiap kelasnya terbatas hanya 15-20 orang aja.
Biasanya di hari Rabu minggu ke-3 ka 😊🙏"

LANGKAH 7 - CLOSING / AJAK DAFTAR
"Kalau sudah siap mulai langkah ke Jepang 🇯🇵
Silakan langsung daftar melalui link berikut ya kak 👇
Karena kuota terbatas, peserta yang lebih dulu daftar akan lebih dulu kami amankan seatnya 😊
Klik 👉 https://s.id/daftarmenduniajepangcianjur

Mohon bantu kirimkan bukti pembayaran dan data konfirmasinya ya, Kak"

LANGKAH 8 - SETELAH USER TRANSFER / KIRIM BUKTI
Minta format konfirmasi ini:
---
Mohon bantu kirimkan bukti pembayaran dan data konfirmasinya ya, Kak

Format Konfirmasi Pembayaran:
Nama:
Nama Rekening Pengirim:
Bank Asal Transfer:
Tanggal Transfer:
Total Transfer: Rp
Untuk Pembayaran: (tulis "Kelas Korea/Jepang/Online/Offline") pilih salah satu

Terima kasih banyak atas konfirmasinya, Kak 🙏
---

Setelah format dikirim, balas:
"Baik ka [Nama], nanti akan ada admin yang konfirmasi yaa 😊🙏
Nanti kan bareng kita ya ka, dibimbing 😊🙏"

═══════════════════════════════════════
INFORMASI REKENING (jika link error / user minta transfer manual)
═══════════════════════════════════════
BCA
1831813364
a.n. PT. INDONESIA SUKSES MENDUNIA

═══════════════════════════════════════
JAWABAN UNTUK PERTANYAAN UMUM
═══════════════════════════════════════

❓ "Belum punya JFT / SSW, apakah bisa masuk LPK?"
→ "Tapi tenang ka, nanti bareng kita ya ka dibimbing 😊🙏"

❓ "Ada job BC (Baito/Care worker) tidak?"
→ "Untuk saat ini kita fokus di TG (Tokutei Ginou) yaa ka 😊"

❓ "LPK nya dimana?"
→ "Kita di Cianjur ka 😊🙏"

❓ "Sudah pernah magang/kerja ke Jepang, bisa ikut?"
→ "Bisa ka, karena kita fokus di TG yaa 😊"

❓ "Apakah online tersedia?"
→ "Kita sudah via online ka, nanti saya bantu yaa 😊🙏"

❓ "Kapan mulai kelas?"
→ Sesuaikan dengan bulan berjalan, kelas dibuka 2 bulan sekali, biasanya Rabu minggu ke-3

═══════════════════════════════════════
ATURAN PENTING
═══════════════════════════════════════
- JANGAN jawab pertanyaan di luar topik kerja ke Jepang/Korea dan program Mendunia
- Jika pertanyaan teknis/tidak tahu, arahkan ke admin: "Nanti saya koordinasikan dengan tim yaa ka 🙏"
- Selalu sebut nama user jika sudah diketahui
- Selalu dorong ke arah closing (daftar/bayar DP)
- Jangan sebut kompetitor atau bandingkan dengan LPK lain
- Gunakan *teks tebal* untuk info penting seperti harga dan nama program
- INGAT: Baca history percakapan dan JANGAN ulangi langkah yang sudah dilakukan
`.trim();

// ─── Schedule Check ──────────────────────────────────────────────────────────
const isWithinSchedule = (settings) => {
  if (Number(settings.schedule_enabled) !== 1) {
    console.log("[AI] ✅ Schedule disabled - AI aktif 24/7");
    return true;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;

  const allowedDays = (settings.schedule_days || "0,1,2,3,4,5,6")
    .split(",")
    .map((d) => parseInt(d.trim()));

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = dayNames[currentDay];

  if (!allowedDays.includes(currentDay)) {
    console.log(`[AI] ⛔ Di luar jadwal - Hari ${dayName} tidak termasuk hari aktif`);
    return false;
  }

  const startTime = settings.schedule_start_time || "08:00:00";
  const endTime = settings.schedule_end_time || "17:00:00";

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const formatTime = (h, m) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  if (currentTime < startMinutes || currentTime > endMinutes) {
    const currentTimeStr = formatTime(currentHours, currentMinutes);
    const startStr = formatTime(startH, startM);
    const endStr = formatTime(endH, endM);
    console.log(`[AI] ⛔ Di luar jadwal - Sekarang ${currentTimeStr}, jadwal ${startStr} - ${endStr}`);
    return false;
  }

  console.log(`[AI] ✅ Dalam jadwal - Hari ${dayName}, jam ${formatTime(currentHours, currentMinutes)}`);
  return true;
};

// ─── Helper: deteksi error quota/token habis ─────────────────────────────────
const isQuotaOrRateLimitError = (err) => {
  const msg = err?.message?.toLowerCase() || "";
  const status = err?.status || err?.response?.status;
  return (
    status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("token") ||
    msg.includes("exceeded") ||
    msg.includes("limit reached") ||
    msg.includes("resource exhausted") ||
    msg.includes("too many requests")
  );
};

// ─── Helper: panggil Gemini dengan history (PRIMARY) ─────────────────────────
const callGemini = async (systemPrompt, history) => {
  // Gemini tidak pakai messages array seperti OpenAI,
  // jadi gabungkan history jadi satu string konteks
  const historyText = history
    .map((m) => `${m.role === "user" ? "User" : "Teh Rindu"}: ${m.content}`)
    .join("\n");

  const fullPrompt = `${systemPrompt}

═══════════════════════════════════════════
HISTORY PERCAKAPAN SEBELUMNYA
═══════════════════════════════════════════
${historyText || "(Percakapan baru, belum ada history)"}
═══════════════════════════════════════════

Balas pesan user terakhir di atas sesuai konteks history.`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
  });
  return response.text;
};

// ─── Helper: panggil Groq dengan history (FALLBACK) ──────────────────────────
const callGroq = async (systemPrompt, history) => {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
  });
  return completion.choices[0]?.message?.content;
};

// ─── Helper: panggil AI — Gemini dulu, fallback ke Groq ──────────────────────
const callAIWithFallback = async (systemPrompt, history) => {
  // ── Coba Gemini terlebih dahulu ──────────────────────────────────────────
  try {
    console.log("[AI] Mencoba Gemini (primary)...");
    const reply = await callGemini(systemPrompt, history);
    console.log("[AI] ✅ Gemini berhasil.");
    return { reply, provider: "gemini" };
  } catch (geminiErr) {
    if (isQuotaOrRateLimitError(geminiErr)) {
      console.warn("[AI] ⚠️ Gemini quota/rate-limit habis. Switch ke Groq (fallback)...");
    } else {
      console.warn(`[AI] ⚠️ Gemini error (${geminiErr.message}). Switch ke Groq (fallback)...`);
    }
  }

  // ── Fallback ke Groq ─────────────────────────────────────────────────────
  try {
    console.log("[AI] Mencoba Groq (fallback)...");
    const reply = await callGroq(systemPrompt, history);
    console.log("[AI] ✅ Groq berhasil (fallback).");
    return { reply, provider: "groq" };
  } catch (groqErr) {
    console.error("[AI] ❌ Groq juga gagal:", groqErr.message);
    throw groqErr;
  }
};

// ─── Main Handler ───────────────────────────────────────────────────────────
export const handleAIResponse = async (
  sessionId,
  remoteJid,
  userMessage,
  sock,
  isFromMe,
  msgKey = null,
) => {
  try {
    // 0. Skip jika pesan dari grup
    if (remoteJid?.endsWith("@g.us")) {
      console.log(`[AI] ⛔ Skip - Pesan dari grup: ${remoteJid}`);
      return;
    }

    // 1. Stop AI jika admin balas manual
    //    Tetap catat ke history supaya konteks tidak putus
    if (isFromMe) {
      if (aiQueues[remoteJid]) {
        clearTimeout(aiQueues[remoteJid].timeoutId);
        clearTimeout(aiQueues[remoteJid].typingTimeoutId);
        delete aiQueues[remoteJid];
      }
      const session = getSession(remoteJid);
      session.history.push({ role: "assistant", content: userMessage });
      if (session.history.length > MAX_HISTORY) {
        session.history = session.history.slice(-MAX_HISTORY);
      }
      return;
    }

    // 2. Ambil settings
    const settings = await queryOne(
      `SELECT is_active, is_rules_active, bot_name, prompt, knowledge_base, 
              min_delay, max_delay, human_wait_time, auto_read, auto_read_delay, after_read_delay,
              schedule_enabled, schedule_start_time, schedule_end_time, schedule_days
       FROM wa_ai_settings WHERE session_id = ?`,
      [sessionId],
    );
    if (!settings) return;

    // 2b. Cek Schedule
    console.log(`[AI] 📅 Cek jadwal untuk ${remoteJid}...`);
    if (!isWithinSchedule(settings)) {
      console.log(`[AI] ⛔ AI tidak aktif - Di luar jadwal`);
      return;
    }

    // 2c. Auto Read
    if (Number(settings.auto_read) === 1 && Number(settings.is_active) === 1) {
      const readDelayMs = (settings.auto_read_delay || 0) * 1000;
      await new Promise((resolve) => setTimeout(resolve, readDelayMs));
      try {
        if (msgKey) {
          await sock.readMessages([msgKey]);
          console.log(`[AI] ✅ Pesan di-read: ${remoteJid}`);
        } else {
          await sock.sendPresenceUpdate("read", remoteJid);
        }
      } catch (readErr) {
        console.warn("[AI] ⚠️ Gagal read:", readErr.message);
        try {
          await sock.sendPresenceUpdate("read", remoteJid);
        } catch (err2) {}
      }
    }

    // 3. Cek & kirim Rules
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

    // 4. Cek status AI aktif
    if (Number(settings.is_active) !== 1) return;

    // 5. Ambil/init session user & update state jika user isi data
    const session = getSession(remoteJid);

    if (isDataFilled(userMessage) && session.step === "NEW") {
      session.step = "DATA_FILLED";
      const extractedName = extractName(userMessage);
      if (extractedName) session.name = extractedName;
      console.log(`[AI] 📝 Data user terdeteksi. Nama: ${session.name}, Step: ${session.step}`);
    }

    // 6. Antrean pesan (jika user spam)
    if (aiQueues[remoteJid]) {
      aiQueues[remoteJid].messages.push(userMessage);
      return;
    }

    // 7. Eksekusi AI
    const executeAIProcess = async (currentSettings) => {
      try {
        if (!aiQueues[remoteJid]) return;
        aiQueues[remoteJid].isProcessing = true;

        // Tunggu after_read_delay sebelum typing
        const afterReadDelayMs = (currentSettings.after_read_delay || 3) * 1000;
        await new Promise((resolve) => setTimeout(resolve, afterReadDelayMs));

        await sock.sendPresenceUpdate("composing", remoteJid);

        // Gabungkan semua pesan yang antri
        const fullUserContent = aiQueues[remoteJid].messages.join(" ");

        // ── Tambahkan pesan user ke history ─────────────────────────────────
        session.history.push({ role: "user", content: fullUserContent });
        if (session.history.length > MAX_HISTORY) {
          session.history = session.history.slice(-MAX_HISTORY);
        }

        // ── Ambil aset media (jika ada) ──────────────────────────────────────
        const availableAssets = await query(
          "SELECT asset_name FROM wa_ai_media_assets WHERE session_id = ?",
          [sessionId],
        );
        const assetListString = availableAssets
          .map((a) => `[[${a.asset_name}]]`)
          .join(", ");

        // ── Bangun System Prompt ─────────────────────────────────────────────
        const hasCustomPrompt = (currentSettings.prompt || "").trim().length > 10;
        const hasKnowledge = (currentSettings.knowledge_base || "").trim().length > 10;

        // Gunakan prompt dari database jika ada, fallback ke default template
        let systemPrompt = hasCustomPrompt ? currentSettings.prompt : DEFAULT_PROMPT;

        // Inject status percakapan supaya AI tidak reset alur
        systemPrompt += `

═══════════════════════════════════════
STATUS PERCAKAPAN USER INI
═══════════════════════════════════════
Step saat ini : ${session.step}
Nama user     : ${session.name || "Belum diketahui"}
${session.step !== "NEW"
  ? "⚠️ PENTING: User SUDAH mengisi data diri. JANGAN kirim form data lagi."
  : "User belum mengisi data diri. Minta user isi form di awal."}
`;

        // Inject knowledge base sebagai informasi tambahan
        if (hasKnowledge) {
          systemPrompt += `

═══════════════════════════════════════
KNOWLEDGE BASE
═══════════════════════════════════════
${currentSettings.knowledge_base}
`;
        }

        if (assetListString) {
          systemPrompt += `
Aset Gambar Tersedia: ${assetListString}
Gunakan tag [[nama_aset]] jika relevan untuk menyertakan gambar/brosur.
`;
        }

        // ── Panggil AI dengan history lengkap ────────────────────────────────
        const { reply: aiReply, provider } = await callAIWithFallback(
          systemPrompt,
          session.history,
        );

        console.log(`[AI] ✅ Reply dari ${provider}`);

        if (!aiReply || !aiQueues[remoteJid]) return;

        // Simpan balasan AI ke history
        session.history.push({ role: "assistant", content: aiReply });
        if (session.history.length > MAX_HISTORY) {
          session.history = session.history.slice(-MAX_HISTORY);
        }

        // Update step berdasarkan isi balasan AI
        if (session.step === "NEW") {
          session.step = "ASKED_DATA";
        } else if (session.step === "DATA_FILLED" && aiReply.toLowerCase().includes("alur")) {
          session.step = "SENT_ALUR";
        } else if (aiReply.includes("8.300.000")) {
          session.step = "SENT_BIAYA";
        } else if (aiReply.includes("daftarmendunia") || aiReply.includes("s.id/daftar")) {
          session.step = "CLOSING";
        }

        // Delay simulasi mengetik
        const minD = (currentSettings.min_delay || 3) * 1000;
        const maxD = (currentSettings.max_delay || 7) * 1000;
        const randomDelay = Math.floor(Math.random() * (maxD - minD + 1) + minD);

        aiQueues[remoteJid].typingTimeoutId = setTimeout(async () => {
          if (!aiQueues[remoteJid]) return;

          let sentMsg;
          const tagRegex = /\[\[(.*?)\]\]/g;
          const match = tagRegex.exec(aiReply);

          // Kirim pesan ke WhatsApp
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

          // Simpan ke database
          try {
            const sekarang = new Date();
            const offset = sekarang.getTimezoneOffset() * 60000;
            const localISOTime = new Date(sekarang - offset)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");

            await query(
              `INSERT INTO wa_messages (
                session_id, message_id, chat_jid, from_jid,
                is_from_me, message_type, content, status, timestamp
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
                localISOTime,
              ],
            );
            console.log(`[AI] ✅ Pesan terkirim & tersimpan: ${localISOTime}`);
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

    // 8. Daftarkan ke antrean dengan human_wait_time
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

// ─── Export helper untuk reset session (opsional) ────────────────────────────
// Berguna jika admin mau reset percakapan user tertentu dari luar
export const resetUserSession = (remoteJid) => {
  if (conversationStore[remoteJid]) {
    delete conversationStore[remoteJid];
    console.log(`[AI] 🔄 Session direset untuk: ${remoteJid}`);
  }
};

// ─── Export untuk lihat semua session aktif (debug) ──────────────────────────
export const getActiveSessions = () => {
  return Object.keys(conversationStore).map((jid) => ({
    jid,
    step: conversationStore[jid].step,
    name: conversationStore[jid].name,
    historyLength: conversationStore[jid].history.length,
  }));
};