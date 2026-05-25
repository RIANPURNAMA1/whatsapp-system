# 📊 TikTok Live Report Feature

Feature untuk membuat laporan hasil live TikTok dengan kemampuan OCR otomatis menggunakan AI (Groq atau Gemini).

## 🎯 Fitur

- ✅ Upload screenshot hasil live TikTok (JPG, PNG, WebP, GIF)
- ✅ Ekstraksi teks otomatis menggunakan Groq Vision API atau Gemini
- ✅ Tampil hasil ekstraksi dengan confidence score
- ✅ Simpan laporan ke database
- ✅ Edit, lihat detail, dan hapus laporan
- ✅ Integrasi dengan sidebar (menu "Laporan Live TikTok")

## 📋 Persyaratan

### Backend
- Node.js dengan Express
- MySQL/MariaDB
- Groq API Key (untuk OCR dengan Groq)
- Google Gemini API Key (opsional, sebagai fallback)

### Frontend
- React 19+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP client)

## 🔧 Setup Backend

### 1. Instalasi Dependencies
Pastikan sudah ada di `backend/package.json`:
```json
{
  "dependencies": {
    "@google/genai": "^1.44.0",
    "axios": "^1.13.6",
    "express": "^4.22.1",
    "multer": "^2.1.1",
    "mysql2": "^3.17.3",
    "uuid": "^9.0.0"
  }
}
```

Install jika belum:
```bash
cd backend
npm install uuid
```

### 2. Environment Variables
Tambahkan ke `.env`:
```env
# OCR Services
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

Dapatkan API Keys:
- **Groq**: https://console.groq.com/
- **Gemini**: https://aistudio.google.com/

### 3. Database Migration
Route sudah otomatis create table saat pertama kali akses.

Tabel yang dibuat:
```sql
CREATE TABLE tiktok_live_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_url TEXT NOT NULL,
  image_filename VARCHAR(255),
  extracted_text LONGTEXT,
  ocr_confidence DECIMAL(5,2),
  report_title VARCHAR(255),
  report_description TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (status),
  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 🚀 API Endpoints

### Upload & Process Image
```http
POST /api/tiktok-live-reports/upload
Content-Type: multipart/form-data

Body:
- image: File (required) - Gambar screenshot live
- title: string (required) - Judul laporan
- description: string (optional) - Keterangan
- user_id: number (optional) - User ID

Response:
{
  "success": true,
  "message": "Image uploaded and OCR completed successfully",
  "data": {
    "id": 1,
    "image_url": "/uploads/tiktok_live_reports/uuid.jpg",
    "extracted_text": "Viewers: 1234\nLikes: 567...",
    "confidence": 0.9,
    "model": "groq-vision"
  }
}
```

### Get All Reports
```http
GET /api/tiktok-live-reports?user_id=1

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "image_url": "/uploads/tiktok_live_reports/...",
      "extracted_text": "...",
      "ocr_confidence": 0.9,
      "report_title": "Laporan Live 21 Mei",
      "status": "completed",
      "created_at": "2024-05-21T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Specific Report
```http
GET /api/tiktok-live-reports/:id?user_id=1

Response:
{
  "success": true,
  "data": { ... }
}
```

### Update Report
```http
PUT /api/tiktok-live-reports/:id
Content-Type: application/json

Body:
{
  "user_id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "extracted_text": "Updated text...",
  "notes": "Some notes"
}
```

### Delete Report
```http
DELETE /api/tiktok-live-reports/:id?user_id=1

Response:
{
  "success": true,
  "message": "Report deleted successfully"
}
```

## 📱 Frontend Components

### TikTokLiveReportPage
Komponen utama di: `frontend/src/components/tiktok/TikTokLiveReport/TikTokLiveReportPage.tsx`

Fitur:
- Upload area dengan drag & drop
- Form input judul & keterangan
- Tabel daftar laporan
- Modal view detail
- Modal edit laporan
- Tombol delete dengan konfirmasi

### Service
File: `frontend/src/services/tiktokLiveReportService.ts`

Methods:
```typescript
uploadImage(file, title?, description?, userId?)
getReports(userId?)
getReport(id, userId?)
updateReport(id, data)
deleteReport(id, userId?)
```

## 📍 Menu Sidebar
Menu sudah ditambahkan di Sidebar dengan:
- **Label**: "Laporan Live TikTok"
- **Icon**: Video (dari lucide-react)
- **ID**: "tiktok-live-report"
- **Kategori**: Marketing & Analitik

## 🛠️ Troubleshooting

### Error: "No OCR service available"
- Pastikan `GROQ_API_KEY` atau `GEMINI_API_KEY` sudah di `.env`
- Restart backend server

### Error: "File too large"
- Limit default 10MB
- Edit di `backend/routes/tiktokLiveReportRoutes.js` di `multer.limits`

### Error: "ENOENT: no such file or directory"
- Pastikan folder `backend/public/uploads/tiktok_live_reports/` ada
- Route akan auto-create jika belum ada

### Gambar tidak tersimpan
- Pastikan path `/uploads` di-serve oleh Express
- Check di `server.js`: `app.use("/uploads", express.static(...))`

## 📚 Struktur File

```
backend/
├── routes/
│   └── tiktokLiveReportRoutes.js (NEW)
├── services/
│   └── ocrService.js (NEW)
├── public/
│   └── uploads/
│       └── tiktok_live_reports/ (auto-created)
└── db_tiktok.js (modified)

frontend/
├── src/
│   ├── components/
│   │   └── tiktok/
│   │       └── TikTokLiveReport/
│   │           ├── TikTokLiveReportPage.tsx (NEW)
│   │           └── index.ts (NEW)
│   ├── services/
│   │   └── tiktokLiveReportService.ts (NEW)
│   ├── pages/
│   │   └── MainApp.tsx (modified)
│   └── components/
│       └── Sidebar.tsx (modified)
```

## 🎨 UI Preview

### Upload Section
- Drag & drop area dengan preview
- Input judul & keterangan
- Upload button dengan loading state
- Statistik sidebar

### Reports Table
- Tabel dengan columns: Judul, Teks, Akurasi, Tanggal
- Tombol action: View, Edit, Delete
- Pagination (bisa ditambahkan)

### Detail Modal
- Preview gambar original
- Teks terekstrak dengan akurasi
- Metadata (tanggal, status)

### Edit Modal
- Form untuk update judul, deskripsi, teks
- Tombol save & batal

## 🔐 Security Notes

1. **User Authentication**: Pastikan endpoint dilindungi auth middleware
2. **File Validation**: Hanya image format yang diizinkan
3. **File Size**: Limit 10MB untuk mencegah abuse
4. **Database**: User hanya bisa akses laporan mereka sendiri

## 📝 Future Enhancements

- [ ] Pagination untuk daftar laporan
- [ ] Export laporan ke PDF/Excel
- [ ] Crop image sebelum OCR
- [ ] Batch upload multiple images
- [ ] Scheduled reports
- [ ] Integration dengan WhatsApp (kirim laporan ke WA)
- [ ] Analytics dashboard untuk trending data
- [ ] Comparison antar laporan live

## 📧 Support

Untuk bug reports atau feature requests, silakan buat issue di repository.

---

**Last Updated**: 22 Mei 2024
**Version**: 1.0.0
