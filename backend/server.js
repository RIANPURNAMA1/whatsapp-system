// server.js - Server Utama Express + Socket.IO
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes.js';
import { createSession, getSessionInfo, isSessionConnected } from './whatsapp.js';
import { query, ensureDbReady } from './db.js'; // Tambahkan ensureDbReady di sini

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ===============================================
// Konfigurasi Socket.IO
// ===============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Expose io ke routes
app.set('io', io);

// ===============================================
// Middleware
// ===============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Folder untuk menyimpan media
// const mediaDir = path.join(__dirname, 'media');
// if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
// app.use('/media', express.static(mediaDir));

// ===============================================
// Routes
// ===============================================
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
// ===============================================
// Socket.IO Events
// ===============================================
io.on('connection', (socket) => {
  console.log(`🔌 Client terhubung: ${socket.id}`);

  socket.on('join:session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} bergabung ke sesi: ${sessionId}`);
  });

  socket.on('leave:session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client terputus: ${socket.id}`);
  });
});

// ===============================================
// Startup: Reconnect sesi yang sebelumnya aktif
// ===============================================
async function startActiveSessions() {
  try {
    // Query ini akan otomatis menunggu ensureDbReady karena fungsi query di db.js sudah kita modifikasi
    const activeSessions = await query(
      "SELECT id FROM wa_sessions WHERE status IN ('connected', 'connecting')"
    );

    if (activeSessions.length > 0) {
      console.log(`🔄 Mencoba reconnect ${activeSessions.length} sesi aktif...`);
      for (const session of activeSessions) {
        console.log(`  → Memulai sesi: ${session.id}`);
        await createSession(session.id, io).catch(err => {
          console.error(`  ✗ Gagal reconnect sesi ${session.id}:`, err.message);
        });
        // Delay antar sesi agar tidak membebani sistem
        await new Promise(r => setTimeout(r, 2000));
      }
    } else {
      console.log('✅ Tidak ada sesi aktif yang perlu di-reconnect.');
    }
  } catch (err) {
    console.error('❌ Error startup sesi:', err.message);
  }
}

// ===============================================
// Mulai server
// ===============================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     WhatsApp System - Backend API      ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    // LANGKAH KRUSIAL: Tunggu Database & Tabel Siap
    console.log('⏳ Menyiapkan database...');
    await ensureDbReady();
    
    console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO aktif`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log('');

    // Jalankan reconnect setelah database dipastikan siap
    await startActiveSessions();

  } catch (error) {
    console.error('💥 GAGAL MEMULAI SERVER:');
    console.error(error.message);
    process.exit(1); // Matikan aplikasi jika database gagal
  }
});

export default app;