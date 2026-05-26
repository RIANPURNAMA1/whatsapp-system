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
import tiktokRoutes from "./routes/live.js";
import tiktokLiveReportRoutes from "./routes/liveReportRoutes.js";
import rotatorPublicRoutes from "./routes/rotatorPublicRoutes.js";
import publicTrackedLinkRoutes from "./routes/publicTrackedLinkRoutes.js";
import leadAnalysisRoutes from "./routes/leadAnalysis.js";
import leadCategoryRoutes from "./routes/leadCategoryRoutes.js";
import { createSession } from "./whatsapp.js";
import { migrateTikTokTables } from "./db_live.js";
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
app.use("/", rotatorPublicRoutes);

// ===============================================
// PUBLIC ROUTE: REDIRECT TRACKED LINK (/t/:code)
// ===============================================
app.use("/", publicTrackedLinkRoutes);
// ===============================================
// 2. API Routes
// ===============================================
app.use("/api", routes);
app.use("/api", leadAnalysisRoutes);
app.use("/api", leadCategoryRoutes);
app.use("/api/tiktok", tiktokRoutes);
app.use("/api/tiktok-live-reports", tiktokLiveReportRoutes);
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
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = now.toISOString().split("T")[0];

    // Skip if already sent today (check DB)
    if (settings.last_sent_date === todayStr) return;

    const frequency = settings.report_frequency || 'daily';

    if (frequency === 'daily') {
      // Check if today is in the scheduled days
      const allowedDays = (settings.report_days || "1,2,3,4,5").split(",").map((d) => parseInt(d.trim()));
      if (!allowedDays.includes(currentDay)) return;
    } else if (frequency === 'weekly') {
      // Check if today is the scheduled day of week
      const weeklyDay = settings.weekly_report_day !== null ? parseInt(settings.weekly_report_day) : 1;
      if (currentDay !== weeklyDay) return;
    } else if (frequency === 'monthly') {
      // Check if today is the scheduled date of month
      const monthlyDate = settings.monthly_report_date !== null ? parseInt(settings.monthly_report_date) : 1;
      if (currentDate !== monthlyDate) return;
    }

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

    console.log(`📊 Mengirim laporan leads ${frequency} per device ke ${targetGroups.length} grup...`);

    const { generateDeviceReport, sendReportToGroups } = await import("./services/leadsReportService.js");

    // Get queue delay from settings (dynamic)
    const queueDelay = settings.queue_delay || 3000;

    // Get all active sessions
    const activeSessions = await query("SELECT id, name FROM wa_sessions WHERE status = 'connected'");

    for (let i = 0; i < activeSessions.length; i++) {
      const session = activeSessions[i];
      try {
        console.log(`📊 [${i + 1}/${activeSessions.length}] Generating ${frequency} report for device: ${session.name} (${session.id})`);

        // Generate report for this device only
        const report = await generateDeviceReport(session.id, null, null, frequency);
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

    console.log("⚡ Redis Cache: Disabled");
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

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
