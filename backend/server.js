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
// TAMBAHKAN queryOne DI SINI Agar tidak "Server Error"
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
// 1. PUBLIC REDIRECT (Link Pendek /r/slug)
// Letakkan DI ATAS /api agar diprioritaskan
// ===============================================
// 1. Pastikan rute ini ada di file utama (app.js atau routes.js)
// Rute ini menangani pengalihan (redirect) dari short link ke WhatsApp
app.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  
  // Mengambil data dari database whatsapp_system
  console.log(`[Rotator] Menghitung klik untuk slug: ${slug}`);

  try {
    // Cari data berdasarkan short_code di tabel link_rotators
    const rotator = await queryOne(
      "SELECT * FROM link_rotators WHERE short_code = ?",
      [slug]
    );

    if (!rotator) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>404 - Link Tidak Ditemukan</h1>
          <p>Link "${slug}" tidak terdaftar di sistem SatuPintu.</p>
        </div>
      `);
    }

    // Update jumlah klik secara asinkron
    query("UPDATE link_rotators SET clicks = clicks + 1 WHERE id = ?", [
      rotator.id,
    ]).catch((err) => console.error("Gagal update clicks:", err));

    // Logika pembersihan nomor dan pembagian nomor WA (Rotator)
    const numbers = rotator.wa_numbers
      .split(",")
      .map((n) => n.trim().replace(/\D/g, ""));
    
    let targetNumber = numbers[0];

    // Jika tipe target adalah 'rotator', pilih nomor secara acak
    if (rotator.target_type === "rotator" && numbers.length > 1) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      targetNumber = numbers[randomIndex];
    }

    // Bangun WhatsApp URL dengan pesan yang sudah di-encode
    const encodedMessage = encodeURIComponent(rotator.message || "");
    const waUrl = `https://wa.me/${targetNumber}?text=${encodedMessage}`;

    // Eksekusi Redirect ke WhatsApp
    console.log(`[Rotator] Redirecting ${slug} -> ${targetNumber}`);
    res.redirect(waUrl);

  } catch (error) {
    console.error("CRITICAL REDIRECT ERROR:", error);
    res.status(500).send("Terjadi kesalahan internal pada sistem rotator.");
  }
});

// 2. Tambahkan Helper untuk Menghasilkan Link di Dashboard
// Gunakan ini saat menampilkan link di tabel atau dashboard
const generateRotatorLink = (slug) => {
  // Mengambil domain frontend dari .env (https://satupintu.mendunia.id)
  const baseUrl = process.env.FRONTEND_URL || "https://satupintu.mendunia.id";
  return `${baseUrl}/r/${slug}`;
};

// ===============================================
// 2. API Routes
// ===============================================
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
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
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🔗 Link Rotator: http://localhost:${PORT}/r/[slug]`);

    await startActiveSessions();
  } catch (error) {
    console.error("💥 GAGAL MEMULAI SERVER:", error.message);
    process.exit(1);
  }
});

export default app;
