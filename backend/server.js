// server.js - Server Utama Express + Socket.IO
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import routes from "./routes.js";
import tiktokRoutes from "./routes/tiktok.js";
import { createSession } from "./whatsapp.js";
import { migrateTikTokTables } from "./db_tiktok.js";
import { query, queryOne, ensureDbReady } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ===============================================
// Konfigurasi Socket.IO
// ===============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.set("io", io);

// ===============================================
// Middleware
// ===============================================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// ===============================================
// PUBLIC ROUTE: REDIRECT ROTATOR (r/:slug)
// ===============================================
app.get("/r/:slug", async (req, res) => {
  const { slug } = req.params;
  const { source } = req.query;

  try {
    const rotator = await queryOne(
      "SELECT * FROM link_rotators WHERE short_code = ?",
      [slug]
    );

    if (!rotator) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1 style="color:#ef4444;">404 - Link Tidak Ditemukan</h1>
          <p>Mohon periksa kembali URL yang Anda masukkan.</p>
        </div>
      `);
    }

    let waData = [];
    const rawWa = rotator.wa_numbers || "";

    try {
      if (typeof rawWa === 'string' && rawWa.trim().startsWith('[')) {
        waData = JSON.parse(rawWa);
      } else if (typeof rawWa === 'string' && rawWa.trim() !== "") {
        waData = rawWa.split(",").map(num => ({ number: num.trim(), weight: 1 }));
      }
    } catch (e) {
      waData = [{ number: String(rawWa).trim(), weight: 1 }];
    }

    waData = waData.filter(item => item && item.number && /\d/.test(item.number));

    if (waData.length === 0) {
      return res.status(404).send("Nomor tujuan WhatsApp tidak tersedia.");
    }

    let selected = waData[0];

    if (rotator.target_type === "rotator" && waData.length > 1) {
      const totalWeight = waData.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
      let randomValue = Math.random() * totalWeight;
      for (const item of waData) {
        const itemWeight = Number(item.weight) || 1;
        if (randomValue < itemWeight) { selected = item; break; }
        randomValue -= itemWeight;
      }
    }

    const targetNumber = selected.number;
    const cleanNumber = targetNumber.toString().replace(/\D/g, "");
    const baseMessage = rotator.message || "";

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const referer = req.headers['referer'] || 'Direct';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';

    query("UPDATE link_rotators SET clicks = clicks + 1 WHERE id = ?", [rotator.id])
      .catch(err => console.error("Error update click count:", err));

    query(
      "INSERT INTO rotator_clicks (rotator_id, ip_address, user_agent, referer, created_at) VALUES (?, ?, ?, ?, NOW())",
      [rotator.id, ipAddress, userAgent, referer]
    ).catch(err => console.error("Error saving log:", err));

    // CEK TIPE: direct = langsung redirect, lander = tampilkan halaman UI
    if (rotator.type === "direct") {
      const encodedMessage = encodeURIComponent(baseMessage);
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`[Rotator] ${slug} -> ${cleanNumber} (direct)`);
      return res.redirect(302, waUrl);
    }

    // type = lander: parse konfigurasi tombol
    let landerConfig = {
      button1: { label: "LIVE TIKTOK", source: "admin_live", sourceText: "sumber dari admin live" },
      button2: { label: "KONTEN TIKTOK", source: "admin_rindu", sourceText: "sumber dari admin rindu" }
    };

    try {
      if (rotator.lander_config) {
        const parsed = JSON.parse(rotator.lander_config);
        if (parsed.button1) landerConfig.button1 = { ...landerConfig.button1, ...parsed.button1 };
        if (parsed.button2) landerConfig.button2 = { ...landerConfig.button2, ...parsed.button2 };
      }
    } catch (e) {
      // pakai default
    }

    // cek source parameter dari kedua tombol
    if (source === landerConfig.button1.source || source === landerConfig.button2.source) {
      const srcCfg = source === landerConfig.button1.source ? landerConfig.button1 : landerConfig.button2;
      const encodedMessage = encodeURIComponent(baseMessage + "\n\n" + srcCfg.sourceText);
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`[Rotator] ${slug} -> ${cleanNumber} (${srcCfg.source})`);
      return res.redirect(302, waUrl);
    }

    const waUrl1 = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(baseMessage + "\n\n" + landerConfig.button1.sourceText)}`;
    const waUrl2 = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(baseMessage + "\n\n" + landerConfig.button2.sourceText)}`;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(`
  <!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${rotator.name}</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: #ffffff;
      width: 100%;
      max-width: 360px;
      border-radius: 5px;
      padding: 30px 24px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }

    h1 {
      font-size: 20px;
      color: #111827;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .info {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 24px;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      text-decoration: none;
      border-radius: 3px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      transition: 0.2s;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .btn-blue {
      background: #2563eb;
      color: white;
    }

    .btn-green {
      background: #16a34a;
      color: white;
    }
  </style>
</head>

<body>
  <div class="card">
    <h1>${rotator.name}</h1>

    <p>Tau Mendunia dari mana 😊?</p>

    <div class="info">
      Silahkan klik salah satu tombol untuk konsultasi dengan admin.
    </div>

    <a href="?source=${landerConfig.button1.source}" class="btn btn-blue">
      ${landerConfig.button1.label}
    </a>

    <a href="?source=${landerConfig.button2.source}" class="btn btn-green">
      ${landerConfig.button2.label}
    </a>
  </div>
</body>
</html>
    `);

  } catch (error) {
    console.error("SERVER ERROR AT REDIRECT:", error);
    res.status(500).send("Terjadi kesalahan pada sistem redirect.");
  }
});

// ===============================================
// PUBLIC ROUTE: REDIRECT TRACKED LINK (/t/:code)
// ===============================================
app.get("/t/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const link = await queryOne(
      "SELECT * FROM tracked_links WHERE short_code = ?",
      [code]
    );

    if (!link) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1 style="color:#ef4444;">404 - Link Tidak Ditemukan</h1>
          <p>Mohon periksa kembali URL yang Anda masukkan.</p>
        </div>
      `);
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const startOfMonth = today.substring(0, 7) + "-01";

    const isNewDay = link.last_click_date !== today;
    const isNewWeek = !link.last_click_date || link.last_click_date < weekStart;
    const isNewMonth = !link.last_click_date || link.last_click_date < startOfMonth;

    let updates = ["clicks = clicks + 1"];
    if (isNewDay) {
      updates.push("clicks_today = 1");
    } else {
      updates.push("clicks_today = clicks_today + 1");
    }
    if (isNewWeek) {
      updates.push("clicks_week = 1");
    } else {
      updates.push("clicks_week = clicks_week + 1");
    }
    if (isNewMonth) {
      updates.push("clicks_month = 1");
    } else {
      updates.push("clicks_month = clicks_month + 1");
    }
    updates.push("last_click_date = ?");

    await query(
      `UPDATE tracked_links SET ${updates.join(", ")} WHERE id = ?`,
      [today, link.id]
    );

    console.log(`[Tracked Link] ${code} -> ${link.original_url}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.redirect(302, link.original_url);

  } catch (error) {
    console.error("SERVER ERROR AT TRACKED LINK:", error);
    res.status(500).send("Terjadi kesalahan pada sistem redirect.");
  }
});
// ===============================================
// 2. API Routes
// ===============================================
app.use("/api", routes);
app.use("/api/tiktok", tiktokRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===============================================
// Socket.IO Events
// ===============================================
io.on("connection", (socket) => {
  console.log(`🔌 Client terhubung: ${socket.id}`);
  socket.on("join:session", (sessionId) => {
    socket.join(`session:${sessionId}`);
  });
  socket.on("disconnect", () => {
    console.log(`🔌 Client terputus: ${socket.id}`);
  });
});

// ===============================================
// Leads Report Auto-Scheduler - Per Device
// ===============================================

async function checkAndSendScheduledReport() {
  try {
    const settings = await queryOne("SELECT * FROM leads_report_settings LIMIT 1");
    if (!settings || settings.is_enabled !== 1) return;

    const now = new Date();
    const currentDay = now.getDay(); // 0=Minggu, 1=Senin, ...
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = now.toISOString().split("T")[0];

    // Skip if already sent today (check DB)
    if (settings.last_sent_date === todayStr) return;

    // Check if today is in the scheduled days
    const allowedDays = (settings.report_days || "1,2,3,4,5").split(",").map((d) => parseInt(d.trim()));
    if (!allowedDays.includes(currentDay)) return;

    // Parse report time (HH:MM)
    const reportTime = settings.report_time ? settings.report_time.substring(0, 5) : "17:00";
    const [targetHour, targetMinute] = reportTime.split(":").map(Number);

    // Time window: if current time >= scheduled time, allow sending
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const targetTimeMinutes = targetHour * 60 + targetMinute;
    if (currentTimeMinutes < targetTimeMinutes) return;

    // Get target groups
    let targetGroups = [];
    try {
      targetGroups = typeof settings.target_groups === "string"
        ? JSON.parse(settings.target_groups)
        : settings.target_groups || [];
    } catch {
      targetGroups = [];
    }

    if (targetGroups.length === 0) return;

    // Mark as sent in DB BEFORE sending to prevent duplicate if interval fires again
    await query("UPDATE leads_report_settings SET last_sent_date = ? WHERE id = ?", [todayStr, settings.id]);

    console.log(`📊 Mengirim laporan leads per device ke ${targetGroups.length} grup...`);

    const { generateDeviceReport, sendReportToGroups } = await import("./services/leadsReportService.js");

    // Get queue delay from settings (dynamic)
    const queueDelay = settings.queue_delay || 3000;

    // Get all active sessions
    const activeSessions = await query("SELECT id, name FROM wa_sessions WHERE status = 'connected'");

    for (let i = 0; i < activeSessions.length; i++) {
      const session = activeSessions[i];
      try {
        console.log(`📊 [${i + 1}/${activeSessions.length}] Generating report for device: ${session.name} (${session.id})`);

        // Generate report for this device only
        const report = await generateDeviceReport(session.id);
        if (!report) continue;

        // Send to groups using this specific session
        const results = await sendReportToGroups(targetGroups, report, session.id);

        const sent = results.filter((r) => r.status === "sent").length;
        const failed = results.filter((r) => r.status === "failed").length;
        console.log(`📊 ${session.name}: ${sent} sukses, ${failed} gagal`);

        // Delay before next device (except for the last one)
        if (i < activeSessions.length - 1) {
          console.log(`📊 Waiting ${queueDelay}ms before next device...`);
          await new Promise(resolve => setTimeout(resolve, queueDelay));
        }
      } catch (err) {
        console.error(`❌ Error sending report for ${session.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ Error sending scheduled report:", err.message);
  }
}

// Check every 30 seconds
setInterval(checkAndSendScheduledReport, 30000);
// Run immediately on startup (after DB is ready) so missed reports from today get sent
setTimeout(checkAndSendScheduledReport, 5000);

// ===============================================
// Startup: Reconnect sesi aktif
// ===============================================
async function startActiveSessions() {
  try {
    const activeSessions = await query(
      "SELECT id FROM wa_sessions WHERE status IN ('connected', 'connecting')",
    );

    if (activeSessions.length > 0) {
      console.log(`🔄 Reconnect ${activeSessions.length} sesi...`);
      for (const session of activeSessions) {
        createSession(session.id, io).catch((err) =>
          console.error(`Err ${session.id}:`, err.message),
        );
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  } catch (err) {
    console.error("❌ Error startup:", err.message);
  }
}

// ===============================================
// Jalankan Server
// ===============================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║      WhatsApp & Rotator System         ║");
  console.log("╚════════════════════════════════════════╝");

  try {
    await ensureDbReady();
    await migrateTikTokTables();
    console.log(`🚀 Backend Run: http://localhost:${PORT}`);

    // Info Link yang benar
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log(`🔗 Link Dashboard: ${frontendUrl}`);
    console.log(`📲 Rotator Endpoint: http://localhost:${PORT}/r/[slug]`);

    await startActiveSessions();
  } catch (error) {
    console.error("💥 GAGAL MEMULAI SERVER:", error.message);
    process.exit(1);
  }
});

export default app;
