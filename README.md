# Satu Pintu — WhatsApp Management System

Sistem manajemen WhatsApp multi-device berbasis web untuk kebutuhan marketing, lead management, closing traffic, dan customer engagement.

---

## Fitur-Fitur

### 1. WhatsApp Multi-Device Connection
Menghubungkan beberapa nomor WhatsApp sekaligus dalam satu dashboard menggunakan protokol WhatsApp Multi-Device. Setiap perangkat dikelola secara independen — connect, reconnect, logout, hingga hapus sesi.

### 2. QR Code Pairing
Pairing perangkat WhatsApp dengan scan QR code secara real-time. Tersedia status koneksi dari idle, loading, waiting QR, connected, hingga error.

### 3. Chat Real-Time
Kirim dan terima pesan WhatsApp secara langsung dengan update real-time via Socket.IO. Mendukung teks, gambar, dan dokumen. Dilengkapi infinite scroll untuk memuat riwayat pesan lama.

### 4. Group Chat
Kelola grup WhatsApp: lihat daftar grup, anggota beserta perannya (admin/superadmin/member), kirim pesan ke grup, dan lihat riwayat pesan grup.

### 5. Global Inbox
Lihat semua percakapan dari seluruh perangkat dalam satu tampilan terpadu. Dilengkapi pencarian dan filter per perangkat.

### 6. Label System
Sinkronisasi label dari WhatsApp Business. Buat, edit, hapus, dan tetapkan label ke chat. Label otomatis tersinkronisasi dari perangkat WhatsApp. Label yang mengandung kata "closing" akan otomatis mendeteksi konversi.

### 7. Lead Detection & Keywords
Deteksi lead otomatis berdasarkan kata kunci per platform (TikTok, Instagram, Facebook, Twitter, WhatsApp, Telegram). Kata kunci dikonfigurasi per sesi perangkat. Mendukung juga organic keywords untuk mendeteksi lead dari balasan admin.

### 8. Leads-Only View
Tampilan chat khusus yang hanya menampilkan pesan masuk yang cocok dengan kata kunci lead. Dilengkapi klasifikasi sumber/platform dengan kode warna dan filter tanggal/perangkat.

### 9. Executive Dashboard
Dashboard eksekutif dengan ringkasan statistik: pesan masuk, terkirim, leads organik, leads aktif, perangkat online, dan status sistem. Dilengkapi grafik aktivitas (line chart), grafik SLA (pie chart), dan grafik perangkat (bar chart).

### 10. Live Chat Feed
Feed real-time menampilkan 15 pesan terbaru dari seluruh perangkat. Klik pesan untuk navigasi cepat ke chat terkait.

### 11. Analytics Charts
Visualisasi data dengan Recharts: ActivityChart (tren volume pesan), SLAChart (Sesuai SLA vs Slow Response vs Tak Terjawab), DeviceBarChart (perbandingan leads per perangkat).

### 12. Social Leads Analytics
Statistik lead per platform (TikTok, Instagram, Facebook, WhatsApp, Google Ads). Dilengkapi drag-and-drop untuk mengatur urutan kartu platform.

### 13. Scheduled Leads Report
Laporan leads otomatis yang dikirim ke grup WhatsApp secara terjadwal. Konfigurasi waktu kirim, hari aktif, grup tujuan, dan delay antrian per perangkat. Laporan mencakup total leads, organic leads, closing, conversion rate, dan breakdown platform. Bisa dikirim manual kapan saja.

### 14. Lead Obstacle Analysis
Analisis hambatan leads: usia (prospek menunda karena masalah usia), biaya (kendala harga), bad leads (tidak merespon setelah admin kirim data). Ditampilkan dalam pie chart dan bar chart dengan filter periode.

### 15. Closing Traffic Tracking
Lacak waktu konversi dari first chat hingga closing. Deteksi otomatis via: pengiriman template payment, penerimaan konfirmasi pembayaran dari lead, atau pemberian label yang mengandung kata "closing". Dilengkapi rata-rata waktu closing per perangkat.

### 16. Link Rotator
Buat tautan pendek (`/r/[slug]`) yang mendistribusikan pengunjung ke beberapa nomor WhatsApp dengan sistem rotasi weighted round-robin. Mendukung tipe direct (redirect langsung) dan lander (halaman perantara). Dilengkapi analitik klik per tautan, per hari, dan breakdown sumber.

### 17. Tracked Links
Buat tautan pendek (`/t/[code]`) untuk melacak klik pada tautan eksternal. Statistik: total klik, hari ini, minggu ini, bulan ini. Redirect 302 ke URL asli.

### 18. Click Analytics
Log klik detail untuk rotator dan tracked links: alamat IP, user agent, referrer, negara, kota, tipe perangkat, browser, sistem operasi.

### 19. AI Auto-Reply (Gemini & Groq)
Asisten AI otomatis yang membalas pesan menggunakan Google Gemini atau Groq (API OpenAI-compatible). Konfigurasi per perangkat: prompt/instruksi kustom, nama bot, knowledge base dari teks dan PDF, serta upload media assets.

### 20. Rules-Based Auto-Reply
Pembalasan otomatis berbasis kata kunci dengan dukungan lampiran gambar. Aturan dieksekusi sebelum AI. Cocok untuk jawaban cepat dan template umum.

### 21. Anti-Ban & Safety Settings
Perlindungan akun WhatsApp dari pemblokiran: pengaturan delay minimal/maksimal pesan agar seperti manusia, batas maksimal pesan per hari, mode tunggu manusia (AI menunggu balasan manusia sebelum merespon), auto-read dengan delay, dan jadwal aktif AI (hari dan jam kerja).

### 22. AI Dashboard Insights
Wawasan dashboard yang dihasilkan AI menggunakan Gemini. Bisa diekspor ke PDF atau disalin ke clipboard. Dilengkapi feedback thumbs up/down.

### 23. TikTok Integration
Kelola komentar TikTok, pesan langsung, dan leads TikTok. Balas komentar langsung dari dashboard. Atur auto-reply rules untuk TikTok. Terima webhook event dari TikTok (komentar, pesan, follow). Statistik TikTok.

### 24. Device Management Panel
Panel kontrol perangkat: lihat status koneksi, buat sesi baru, reconnect, logout, dan hapus sesi. Dilengkapi informasi detail setiap perangkat.

### 25. User Management
Kelola pengguna sistem: buat, edit, hapus. Atur username, password, nama lengkap, role, dan cabang. Lihat status online berdasarkan aktivitas login.

### 26. Role-Based Access Control (RBAC)
Tiga tipe role: **System** (Super Admin — akses penuh), **Manager** (akses marketing dan manajemen pengguna), **Custom** (terbatas pada sesi WhatsApp yang ditetapkan). Role system tidak bisa diedit/dihapus.

### 27. Secure Authentication
Login dengan username, password, dan CAPTCHA kode acak 6 karakter. Menggunakan JWT token dengan expiry 24 jam. Auto-logout saat token expired.

### 28. Session Timeout
Konfigurasi waktu timeout sesi. Timer auto-logout yang mereset pada setiap aktivitas. Dilengkapi notifikasi suara dan desktop.

### 29. Real-Time Notifications
Notifikasi real-time untuk pesan baru: suara notifikasi, desktop notification, dan speech synthesis dengan suara Indonesia ("Ada pesan masuk, cek sekarang").

### 30. Platform Settings
Pengaturan per platform (WhatsApp, TikTok, Instagram, Facebook): toggle auto-reply, notifikasi suara/desktop, auto-online, save contact, typing indicator, read receipt, auto-like, story notify, auto-inbox, dan lainnya.

### 31. System Configuration
Pengaturan sistem: tema (terang/gelap), bahasa, timezone, interval auto-refresh dashboard.

### 32. Link Preview
Preview tautan otomatis saat mengirim pesan yang mengandung URL.

### 33. Mobile-Responsive UI
Tampilan responsif yang beradaptasi di perangkat mobile dengan hamburger menu dan layout yang menyesuaikan.

### 34. Dark Mode
Dukungan tema gelap yang disimpan di localStorage. Seluruh komponen menyesuaikan dengan tema aktif.

### 35. Auto Database Migration
Database MySQL dibuat dan dimigrasi secara otomatis saat server pertama kali dijalankan. 15+ tabel siap pakai tanpa konfigurasi manual.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| State | Zustand 5 |
| UI | shadcn/ui, Lucide Icons, Recharts |
| Backend | Node.js, Express, Socket.IO |
| WhatsApp | @whiskeysockets/baileys (Multi-Device) |
| Database | MySQL, Sequelize ORM |
| Auth | JWT, bcryptjs |
| AI | Google Gemini API, Groq (OpenAI-compatible) |
| Real-time | Socket.IO |
| Lainnya | Axios, date-fns, jsPDF, html2canvas, react-hot-toast, SweetAlert2, @hello-pangea/dnd |

---

## Cara Menjalankan

### Prasyarat
- Node.js 18+
- MySQL 8+
- npm atau yarn

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi database
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env dengan URL backend
npm install
npm run dev
```

Akses frontend di `http://localhost:5173` dan backend di `http://localhost:3001`.
