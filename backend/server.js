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
import { createSession } from "./whatsapp.js";
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

  try {
    // 1. Ambil data rotator berdasarkan slug/short_code
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

    // 2. Parsing Data Nomor WA (Menangani JSON atau String biasa)
    let waData = [];
    const rawWa = rotator.wa_numbers || "";

    try {
      if (typeof rawWa === 'string' && rawWa.trim().startsWith('[')) {
        waData = JSON.parse(rawWa);
      } else if (typeof rawWa === 'string' && rawWa.trim() !== "") {
        // Fallback jika data di DB hanya string nomor biasa (comma separated)
        waData = rawWa.split(",").map(num => ({ number: num.trim(), weight: 1 }));
      }
    } catch (e) {
      // Fallback terakhir jika JSON korup
      waData = [{ number: String(rawWa).trim(), weight: 1 }];
    }

    // Filter nomor yang tidak valid
    waData = waData.filter(item => item && item.number && /\d/.test(item.number));

    if (waData.length === 0) {
      return res.status(404).send("Nomor tujuan WhatsApp tidak tersedia.");
    }

    // 3. Logika Pemilihan Nomor Berdasarkan Bobot (Weighted Random)
    let selected = waData[0]; // Default nomor pertama

    if (rotator.target_type === "rotator" && waData.length > 1) {
      const totalWeight = waData.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
      let randomValue = Math.random() * totalWeight;

      for (const item of waData) {
        const itemWeight = Number(item.weight) || 1;
        if (randomValue < itemWeight) {
          selected = item;
          break;
        }
        randomValue -= itemWeight;
      }
    }

    const targetNumber = selected.number;

    // 4. Proses Logging & Analytics (Async/Background)
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const referer = req.headers['referer'] || 'Direct';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
    
    // Update counter klik total
    query("UPDATE link_rotators SET clicks = clicks + 1 WHERE id = ?", [rotator.id])
      .catch(err => console.error("Error update click count:", err));

    // Simpan log detail kunjungan
    query(
      "INSERT INTO rotator_clicks (rotator_id, ip_address, user_agent, referer, created_at) VALUES (?, ?, ?, ?, NOW())",
      [rotator.id, ipAddress, userAgent, referer]
    ).catch(err => console.error("Error saving log:", err));

    // 5. Konstruksi URL WhatsApp
    const cleanNumber = targetNumber.toString().replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(rotator.message || "");
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    // 6. Header Anti-Cache (Sangat Penting untuk Akurasi Rotator)
    // Mencegah browser melakukan redirect otomatis dari cache tanpa bertanya ke server
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 7. Execute Redirect
    console.log(`[Rotator] ${slug} -> ${cleanNumber} (W:${selected.weight || 1})`);
    return res.redirect(302, waUrl);

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
