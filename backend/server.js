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
import { query } from './db.js';

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

// Folder untuk menyimpan media
const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
app.use('/media', express.static(mediaDir));

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
    const activeSessions = await query(
      "SELECT id FROM wa_sessions WHERE status IN ('connected', 'connecting')"
    );

    console.log(`🔄 Mencoba reconnect ${activeSessions.length} sesi aktif...`);

    for (const session of activeSessions) {
      console.log(`  → Memulai sesi: ${session.id}`);
      await createSession(session.id, io).catch(err => {
        console.error(`  ✗ Gagal reconnect sesi ${session.id}:`, err.message);
      });
      // Delay antar sesi
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (err) {
    console.error('Error startup sesi:', err);
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
  console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
  console.log(`📡 Socket.IO aktif`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log('');

  // Reconnect sesi aktif
  await startActiveSessions();
});

export default app;