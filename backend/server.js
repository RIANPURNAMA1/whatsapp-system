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

// Static Files
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// ===============================================
// 1. PUBLIC REDIRECT (Link Rotator)
// Gunakan prefix /r/ agar tidak bentrok dengan route lain
// ===============================================
app.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  console.log(`[Rotator] Menghitung klik untuk slug: ${slug}`);

  try {
    const rotator = await queryOne(
      "SELECT * FROM link_rotators WHERE short_code = ?",
      [slug],
    );

    if (!rotator) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>404 - Link Tidak Ditemukan</h1>
          <p>Link "${slug}" tidak terdaftar di sistem SatuPintu.</p>
        </div>
      `);
    }

    // Update klik (Asynchronous)
    query("UPDATE link_rotators SET clicks = clicks + 1 WHERE id = ?", [
      rotator.id,
    ]).catch((err) => console.error("Gagal update clicks:", err));

    // Logika pembagian nomor WA
    const numbers = rotator.wa_numbers
      .split(",")
      .map((n) => n.trim().replace(/\D/g, ""));

    let targetNumber = numbers[0];

    if (rotator.target_type === "rotator" && numbers.length > 1) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      targetNumber = numbers[randomIndex];
    }

    const encodedMessage = encodeURIComponent(rotator.message || "");
    const waUrl = `https://wa.me/${targetNumber}?text=${encodedMessage}`;

    console.log(`[Rotator] Redirecting ${slug} -> ${targetNumber}`);

    // Redirect langsung ke WhatsApp
    res.redirect(waUrl);
  } catch (error) {
    console.error("CRITICAL REDIRECT ERROR:", error);
    res.status(500).send("Terjadi kesalahan internal pada sistem rotator.");
  }
});

// ===============================================
// 2. API Routes
// ===============================================
app.use("/api", routes);

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
    console.log(`📲 Rotator Endpoint: http://localhost:${PORT}/[slug]`);

    await startActiveSessions();
  } catch (error) {
    console.error("💥 GAGAL MEMULAI SERVER:", error.message);
    process.exit(1);
  }
});

export default app;
