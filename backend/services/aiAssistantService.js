import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { query } from "../db.js";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function gatherDatabaseContext() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [
    totalLeads,
    todayLeads,
    categoryDistribution,
    totalMessages,
    todayMessages,
    devices,
    leadProducts,
    closingStats,
    recentMessages,
    activeSessions,
    totalContacts,
    keywordPlatforms,
    socialPlatformLeads,
  ] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM wa_chats`),
    query(`SELECT COUNT(*) as count FROM wa_chats WHERE DATE(created_at) = ?`, [todayStr]),
    query(`SELECT lc.label, lc.color, COUNT(la.id) as count FROM lead_categories lc LEFT JOIN lead_analysis la ON lc.name = la.category GROUP BY lc.id, lc.label, lc.color ORDER BY count DESC`),
    query(`SELECT COUNT(*) as count FROM wa_messages`),
    query(`SELECT COUNT(*) as count FROM wa_messages WHERE DATE(timestamp) = ?`, [todayStr]),
    query(`SELECT id, name, status, phone_number FROM wa_sessions ORDER BY name ASC`),
    query(`SELECT id, name FROM lead_products ORDER BY name ASC`),
    query(`SELECT COUNT(*) as total, COALESCE(SUM(durasi_jam), 0) as total_durasi FROM closing_traffic WHERE DATE(closing_time) = ?`, [todayStr]),
    query(`SELECT message_type, COUNT(*) as count FROM wa_messages WHERE DATE(timestamp) = ? GROUP BY message_type ORDER BY count DESC LIMIT 5`, [todayStr]),
    query(`SELECT COUNT(*) as count FROM wa_sessions WHERE status = 'connected'`),
    query(`SELECT COUNT(*) as count FROM wa_contacts`),
    query(`SELECT platform, COUNT(*) as keyword_count FROM lead_keywords GROUP BY platform ORDER BY platform ASC`),
    query(`SELECT lk.platform, COUNT(DISTINCT m.chat_jid) as lead_count
           FROM lead_keywords lk
           JOIN wa_messages m ON m.session_id = lk.session_id
             AND LOWER(m.content) LIKE CONCAT('%', LOWER(lk.keyword_text), '%')
             AND m.is_from_me = 0 AND m.chat_jid NOT LIKE '%@g.us'
           WHERE DATE(m.timestamp) = ?
           GROUP BY lk.platform ORDER BY lead_count DESC`, [todayStr]),
  ]);

  const leadsToday = todayLeads[0]?.count || 0;
  const messagesToday = todayMessages[0]?.count || 0;
  const totalMsg = totalMessages[0]?.count || 0;
  const allLeads = totalLeads[0]?.count || 0;
  const connectedDevices = activeSessions[0]?.count || 0;
  const contacts = totalContacts[0]?.count || 0;

  let categoryText = categoryDistribution
    .map((c) => `  - ${c.label} (${c.count} lead)`)
    .join("\n");

  let deviceText = devices
    .map((d) => `  - ${d.name}: ${d.status === "connected" ? "🟢 Online" : `🔴 ${d.status}`}${d.phone_number ? ` (${d.phone_number})` : ""}`)
    .join("\n");

  let productsText = leadProducts.length > 0
    ? leadProducts.map((p) => `  - ${p.name}`).join("\n")
    : "  (belum ada produk)";

  let recentText = recentMessages
    .map((m) => `  - ${m.message_type}: ${m.count} pesan`)
    .join("\n");

  let keywordText = keywordPlatforms.length > 0
    ? keywordPlatforms.map((k) => `  - ${k.platform}: ${k.keyword_count} keyword`).join("\n")
    : "  (belum ada keyword)";

  let socialLeadsText = socialPlatformLeads.length > 0
    ? socialPlatformLeads.map((p) => `  - ${p.platform}: ${p.lead_count} leads`).join("\n")
    : "  (belum ada data sosial media leads)";

  return `
## Ringkasan Database

### Leads
- Total leads: ${allLeads.toLocaleString()}
- Lead masuk hari ini: ${leadsToday}
- Total kontak: ${contacts.toLocaleString()}

### Distribusi Kategori Lead
${categoryText || "  (belum ada data)"}

### Pesan
- Total pesan: ${totalMsg.toLocaleString()}
- Pesan hari ini: ${messagesToday}
- Tipe pesan hari ini:
${recentText || "  (belum ada data)"}

### Perangkat
- Device online: ${connectedDevices} dari ${devices.length}
${deviceText || "  (belum ada perangkat)"}

### Produk Leads
${productsText}

### Closing & Trafik Hari Ini
- Total closing: ${closingStats[0]?.total || 0}
- Total durasi jam: ${closingStats[0]?.total_durasi || 0}

### Keyword Management (Platform)
${keywordText}

### Social Media Leads (per Platform)
${socialLeadsText}
`;
}

const SYSTEM_PROMPT = `Kamu adalah "Satu Pintu AI" — asisten AI cerdas untuk dashboard monitoring WhatsApp Business Suite.
Tugasmu adalah menjawab pertanyaan user berdasarkan DATA RIIL dari database sistem.

PANDUAN:
1. Gunakan bahasa Indonesia yang ramah dan profesional.
2. Jawab berdasarkan data konteks yang diberikan. Jika data tidak mencukupi, katakan dengan jujur.
3. Berikan insight dan rekomendasi jika relevan.
4. JANGAN GUNAKAN TABEL MARKDOWN (| kolom |). Gunakan format kartu/ringkasan sederhana seperti contoh di bawah.
5. Jika user bertanya tentang tren, bandingkan data jika memungkinkan.
6. Jangan menebak data yang tidak ada di konteks.
7. Respons harus singkat, padat, dan informatif.
8. Saat membahas leads, sertakan data dari Keyword Management (platform/keyword yang terdaftar) dan Social Media Leads (jumlah lead per platform dari keyword matching).

CONTOH FORMAT YANG BENAR (gunakan ini, JANGAN pakai tabel):

**Total Leads:** 3
**Conversion:** 667%
**Closing:** 20

**Platform Sources:**
- hai: 1 leads
- live tiktok: 1 leads
- tiktok: 1 leads

**Messages:** 11

Gunakan **bold** untuk label, lalu value setelah titik dua. Untuk daftar, gunakan bullet point (-). Jangan pernah membuat tabel markdown.
`;

async function callGemini(systemPrompt, context, question) {
  const fullPrompt = `${systemPrompt}

${"═══════════════════════════════════════════"}
DATA KONTEKS DARI DATABASE
${"═══════════════════════════════════════════"}
${context}

${"═══════════════════════════════════════════"}
PERTANYAAN USER
${"═══════════════════════════════════════════"}
${question}

Jawab pertanyaan user berdasarkan data di atas. Gunakan bahasa Indonesia.`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
  });
  return response.text;
}

async function callGroq(systemPrompt, context, question) {
  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `DATA KONTEKS DARI DATABASE:\n${context}\n\nPERTANYAAN USER:\n${question}\n\nJawab pertanyaan user berdasarkan data di atas. Gunakan bahasa Indonesia.`,
    },
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content;
}

export async function askAssistant(question) {
  const context = await gatherDatabaseContext();

  try {
    const reply = await callGemini(SYSTEM_PROMPT, context, question);
    return { reply, provider: "gemini" };
  } catch (geminiErr) {
    console.warn("[AI Assistant] Gemini gagal, fallback ke Groq:", geminiErr.message);
  }

  try {
    const reply = await callGroq(SYSTEM_PROMPT, context, question);
    return { reply, provider: "groq" };
  } catch (groqErr) {
    console.error("[AI Assistant] Groq juga gagal:", groqErr.message);
    throw new Error("Semua AI provider gagal merespons.");
  }
}
