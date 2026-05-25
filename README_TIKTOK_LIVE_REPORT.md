# 📊 TikTok Live Report Feature - Complete Implementation

Fitur lengkap untuk membuat laporan hasil live TikTok dengan ekstraksi teks otomatis menggunakan AI (Groq Vision atau Google Gemini).

## 🎯 Apa itu Feature Ini?

Feature ini memungkinkan:
1. **Upload** screenshot hasil live TikTok (JPG, PNG, WebP, GIF)
2. **Ekstraksi otomatis** teks/data dari gambar menggunakan AI
3. **Simpan laporan** ke database dengan metadata lengkap
4. **Manage laporan** (view, edit, delete) dengan UI yang user-friendly
5. **Integrasi sidebar** - Menu tersedia di "Marketing & Analitik"

## 🚀 Mulai Dari Sini

### Quick Start (5 menit)
Jika ingin setup cepat tanpa baca banyak:
```bash
# 1. Edit konfigurasi
nano backend/.env  # Isi GROQ_API_KEY

# 2. Jalankan server
cd backend && npm run dev

# 3. Di terminal baru
cd frontend && npm run dev

# 4. Akses http://localhost:5173
```

Selesai! Menu "Laporan Live TikTok" akan muncul di sidebar.

### Setup Lengkap (15-20 menit)
Baca dokumentasi step-by-step: **[TIKTOK_LIVE_REPORT_SETUP.md](./TIKTOK_LIVE_REPORT_SETUP.md)**

## 📚 Dokumentasi

| Dokumen | Untuk Apa |
|---------|-----------|
| **TIKTOK_LIVE_REPORT_SETUP.md** | Setup step-by-step dengan troubleshooting |
| **TIKTOK_LIVE_REPORT_GUIDE.md** | API docs, fitur lengkap, architecture |
| **IMPLEMENTATION_SUMMARY.md** | List semua file yang dibuat/diubah |

## 📁 Files yang Dibuat

### Backend (3 files)
```
backend/
├── routes/tiktokLiveReportRoutes.js     ← Upload & OCR API endpoints
├── services/ocrService.js               ← AI Integration (Groq + Gemini)
└── [MODIFIED] db_tiktok.js              ← Database table untuk laporan
```

### Frontend (4 files)
```
frontend/
├── src/
│   ├── components/tiktok/TikTokLiveReport/
│   │   ├── TikTokLiveReportPage.tsx      ← Main component (upload, table, modal)
│   │   └── index.ts
│   ├── services/tiktokLiveReportService.ts  ← API client
│   ├── [MODIFIED] components/Sidebar.tsx      ← Add menu
│   └── [MODIFIED] pages/MainApp.tsx           ← Add routing
```

## 🎨 UI/UX Features

### Upload Section
- Drag & drop area dengan preview
- Input judul & keterangan
- Upload button dengan loading animation
- Statistics sidebar (total, success count)

### Reports Table
- Tabel dengan columns: Judul, Teks, Akurasi, Tanggal
- Action buttons: View, Edit, Delete
- Hover effects & transitions

### Modals
- **Detail Modal**: Lihat gambar original & teks hasil
- **Edit Modal**: Update judul, deskripsi, teks
- Smooth animations & responsive

## 🔑 Key Features

✨ **Smart Upload**
- Validasi file type (hanya image)
- Limit size (10MB max)
- Preview sebelum upload

🤖 **AI-Powered OCR**
- Groq Vision API (primary)
- Google Gemini (fallback)
- Confidence score untuk setiap ekstraksi
- Highly accurate text extraction

💾 **Database Integration**
- Auto-save ke MySQL
- Full CRUD operations
- User isolation (setiap user hanya lihat laporan mereka)

📱 **Responsive Design**
- Mobile-friendly
- Tablet optimized
- Desktop full-featured

🎯 **User-Friendly**
- Toast notifications (success/error)
- Loading states
- Confirmation dialogs
- Intuitive UI/UX

## 📋 Requirements

### Must Have
- Node.js v14+
- MySQL/MariaDB
- Groq API Key (free: https://console.groq.com/)

### Optional
- Google Gemini API Key (free: https://aistudio.google.com/)

## ⚡ Quick Configuration

### 1. Get API Keys

**Groq API Key** (Required):
1. Buka https://console.groq.com/
2. Sign up → Login
3. Menu "API Keys" → Create new key
4. Copy key

**Gemini API Key** (Optional):
1. Buka https://aistudio.google.com/
2. "Create new API key"
3. Copy key

### 2. Setup .env
Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_xxx_your_key_here
GEMINI_API_KEY=AIzaSyDxxx_your_key_here  # optional
FRONTEND_URL=http://localhost:5173
```

### 3. Run Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Access Feature
- Buka http://localhost:5173
- Login dengan user manager/system
- Sidebar → "Laporan Live TikTok" (di section Marketing & Analitik)

## 📊 API Endpoints

```
POST   /api/tiktok-live-reports/upload     Upload & OCR
GET    /api/tiktok-live-reports            Get all reports
GET    /api/tiktok-live-reports/:id        Get specific report
PUT    /api/tiktok-live-reports/:id        Update report
DELETE /api/tiktok-live-reports/:id        Delete report
```

Lihat dokumentasi lengkap di [TIKTOK_LIVE_REPORT_GUIDE.md](./TIKTOK_LIVE_REPORT_GUIDE.md#-api-endpoints)

## 🗄️ Database Schema

Otomatis created saat server start. Table: `tiktok_live_reports`

Columns:
- `id` - Primary key
- `user_id` - User yang membuat laporan
- `image_url` - Path ke gambar tersimpan
- `extracted_text` - Teks hasil OCR
- `ocr_confidence` - Akurasi ekstraksi (0-1)
- `report_title` - Judul laporan
- `report_description` - Deskripsi/keterangan
- `status` - pending/completed/failed
- `created_at`, `updated_at` - Timestamps

## 🧪 Testing

### Test Upload
1. Siapkan screenshot dari live stream
2. Click "Upload Gambar"
3. Drag & drop gambar
4. Isi judul
5. Click "Upload & Proses dengan AI"
6. Tunggu 5-10 detik

### Expected Result
- ✅ Teks terekstrak muncul di table
- ✅ Data tersimpan di database
- ✅ Gambar tersimpan di `backend/public/uploads/tiktok_live_reports/`
- ✅ Confidence score terisi (0-100%)

### Troubleshooting
Jika ada error, cek:
1. Backend console untuk API errors
2. Browser console (F12) untuk JavaScript errors
3. Check `.env` - GROQ_API_KEY harus diisi
4. Verify network di DevTools (F12 → Network)

## 📈 Usage Example

```typescript
// Import service
import { tiktokLiveReportService } from "@/services/tiktokLiveReportService";

// Upload image
const response = await tiktokLiveReportService.uploadImage(
  file,                      // File object
  "Laporan Live 21 Mei",     // Title
  "Live viewers: 5k",        // Description
  userId                     // User ID
);

// Get all reports
const reports = await tiktokLiveReportService.getReports(userId);

// Update report
await tiktokLiveReportService.updateReport(id, {
  title: "Updated Title",
  description: "Updated desc",
  extracted_text: "Updated text"
});

// Delete report
await tiktokLiveReportService.deleteReport(id);
```

## 🔐 Security

- User authentication (JWT)
- File type & size validation
- SQL injection prevention
- CORS configured
- Secure file naming (UUID)

## 🚀 Deployment

Untuk production:
1. Set `NODE_ENV=production`
2. Enable SSL/HTTPS
3. Configure proper database
4. Setup API rate limiting
5. Configure backups
6. Monitor logs

## 📞 Troubleshooting

### Common Issues

**"GROQ_API_KEY is not defined"**
→ Edit `.env`, isi GROQ_API_KEY, restart server

**"File upload failed"**
→ Check folder exists: `backend/public/uploads/tiktok_live_reports/`

**"OCR extraction failed"**
→ Verify API key valid, check network, try fallback (Gemini)

**"Table doesn't exist"**
→ Run: `cd backend && node migrate.js`

Lihat lengkapnya: [Troubleshooting Guide](./TIKTOK_LIVE_REPORT_SETUP.md#-troubleshooting)

## 🎓 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  - TikTokLiveReportPage (Upload, Table, Modals)            │
│  - Service Layer (API calls)                               │
│  - Sidebar Integration                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────────────────────┐
│                    Backend (Node/Express)                  │
│  - Routes (5 endpoints)                                    │
│  - Services (OCR logic)                                    │
│  - Multer (File upload)                                    │
│  - Database (MySQL)                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    External Services                        │
│  - Groq Vision API (primary OCR)                            │
│  - Google Gemini API (fallback)                             │
│  - MySQL Database                                          │
│  - File System Storage                                     │
└─────────────────────────────────────────────────────────────┘
```

## 📅 Update History

| Tanggal | Versi | Changes |
|---------|-------|---------|
| 22 Mei 2024 | 1.0.0 | Initial release - Full feature implementation |

## 🎉 Success!

Jika sudah bisa:
- ✅ Lihat menu "Laporan Live TikTok" di sidebar
- ✅ Upload gambar tanpa error
- ✅ Lihat teks terekstrak
- ✅ CRUD operasi berjalan lancar

**Maka feature sudah berhasil diimplementasi!** 🎊

## 📖 Dokumentasi Lengkap

1. [Setup Guide](./TIKTOK_LIVE_REPORT_SETUP.md) - Step-by-step installation
2. [Feature Guide](./TIKTOK_LIVE_REPORT_GUIDE.md) - API & feature details
3. [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - File checklist

## 🔗 Useful Links

- Groq Console: https://console.groq.com/
- Gemini API: https://aistudio.google.com/
- Project Repo: (Add your repo link)
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:5173

## 💡 Tips & Tricks

- **Best image quality**: Screenshot 1080p+ untuk OCR lebih akurat
- **API rate limits**: Groq free tier ~14,400 requests/min
- **Gemini fallback**: Otomatis jika Groq gagal (good backup)
- **Database backup**: Backup sebelum production
- **Monitor logs**: Use `npm run dev` untuk lihat logs real-time

## 🤝 Contributing

Features akan terus dikembangkan. Ideas:
- PDF export
- Batch processing
- Advanced analytics
- WhatsApp integration
- Real-time collaboration

## 📄 License

Same as main project

---

**Last Updated**: 22 Mei 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

**Pertanyaan? Baca dokumentasi atau check browser console untuk error details!** 🚀
