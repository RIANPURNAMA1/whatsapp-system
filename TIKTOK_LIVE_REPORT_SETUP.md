# 🚀 Setup Instructions - TikTok Live Report Feature

Panduan lengkap untuk implementasi fitur TikTok Live Report.

## ✅ Checklist Pre-Implementation

Pastikan sudah ada:
- [ ] Node.js v14+ terinstall
- [ ] MySQL/MariaDB running
- [ ] Groq API Key (gratis dari https://console.groq.com/)
- [ ] Google Gemini API Key (opsional, gratis dari https://aistudio.google.com/)
- [ ] Project sudah setup dengan backend & frontend

## 🔧 Step-by-Step Setup

### Step 1: Backup Database (Optional)
```bash
# Jika sudah ada database
mysqldump -u root -p whatsapp_system > backup_$(date +%Y%m%d).sql
```

### Step 2: Install Dependencies Backend

```bash
cd backend

# Jika belum install uuid
npm install uuid

# Atau jika sudah ada, cukup update
npm install
```

Verifikasi di `package.json` sudah ada:
```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "multer": "^2.1.1",
    "@google/genai": "^1.44.0"
  }
}
```

### Step 3: Configure Environment Variables

Edit/Create `.env` di folder backend:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_system

# API Keys - HARUS DIISI
GROQ_API_KEY=gsk_xxx_your_key_here
GEMINI_API_KEY=AIzaSyDx_xxx_your_key_here

# Server Config
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Cara mendapatkan API Keys:**

1. **Groq API Key**:
   - Buka https://console.groq.com/
   - Sign up atau login dengan Google
   - Buka menu API Keys (di sidebar)
   - Create new API key
   - Copy key dan paste di `.env`

2. **Gemini API Key** (Optional):
   - Buka https://aistudio.google.com/
   - Create new API key
   - Copy dan paste di `.env`

### Step 4: Migrate Database

The migration akan auto-run saat server start, tapi bisa manual juga:

```bash
# Manual run jika diperlukan
# Di dalam backend folder
node migrate.js
```

Verify table sudah created:
```bash
mysql -u root -p whatsapp_system
> SHOW TABLES LIKE 'tiktok_live%';
> DESC tiktok_live_reports;
```

### Step 5: Verify Server Routes

Edit `backend/server.js` dan verify sudah ada:

```javascript
import tiktokLiveReportRoutes from "./routes/tiktokLiveReportRoutes.js";

// Di section "API Routes"
app.use("/api/tiktok-live-reports", tiktokLiveReportRoutes);
```

### Step 6: Start Backend Server

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Or production mode
npm start
```

Expected output:
```
✅ TikTok tables migration completed
🚀 Server running on http://localhost:3000
```

### Step 7: Verify Frontend Components

Check sudah ada files:
- [ ] `frontend/src/components/tiktok/TikTokLiveReport/TikTokLiveReportPage.tsx`
- [ ] `frontend/src/services/tiktokLiveReportService.ts`
- [ ] Updated `frontend/src/components/Sidebar.tsx` (dengan menu "Laporan Live TikTok")
- [ ] Updated `frontend/src/pages/MainApp.tsx` (dengan route handling)

### Step 8: Start Frontend

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build
```

### Step 9: Test Feature

1. **Open Frontend**:
   - Navigate ke http://localhost:5173
   - Login dengan user yang punya role "manager" atau "system"

2. **Test Upload**:
   - Sidebar → "Marketing & Analitik" → "Laporan Live TikTok"
   - Drag & drop atau click upload area
   - Pilih screenshot dari live TikTok (JPG/PNG)
   - Isi judul laporan
   - Klik "Upload & Proses dengan AI"
   - Tunggu 5-10 detik untuk OCR processing

3. **Verify Success**:
   - Teks berhasil diekstrak muncul di tabel
   - Gambar tersimpan di `backend/public/uploads/tiktok_live_reports/`
   - Data tersimpan di database `tiktok_live_reports`

4. **Test CRUD**:
   - View detail: Klik icon mata
   - Edit: Klik icon pensil, update, save
   - Delete: Klik icon trash, confirm

### Step 10: Monitor Logs

Jika ada error, check terminal:

**Backend logs**:
```bash
# Development mode sudah show logs real-time
npm run dev

# Lihat di console untuk error messages
```

**Browser console** (Frontend):
- Buka DevTools (F12)
- Lihat tab Console untuk JavaScript errors
- Tab Network untuk API calls

## 🧪 Testing

### Test Cases

1. **Upload Image**
   - ✅ Upload JPG
   - ✅ Upload PNG
   - ✅ Upload WebP
   - ✅ Reject file > 10MB
   - ✅ Reject non-image files

2. **OCR Processing**
   - ✅ Groq API success
   - ✅ Fallback ke Gemini jika Groq fail
   - ✅ Ekstraksi teks akurat
   - ✅ Confidence score terisi

3. **Database**
   - ✅ Data tersimpan ke DB
   - ✅ Retrieve data dari DB
   - ✅ Update data
   - ✅ Delete data & file

4. **UI/UX**
   - ✅ Upload form validation
   - ✅ Loading states visible
   - ✅ Success/error toast notifications
   - ✅ Modal dialogs work properly
   - ✅ Responsive di mobile

### Sample Test Image

Gunakan screenshot dari live stream (TikTok, YouTube, dll) yang berisi stats:
- Viewers count
- Likes
- Follower gains
- Gift values
- Comments count

## 🐛 Troubleshooting

### Error: "GROQ_API_KEY is not defined"
```
Solution:
1. Pastikan .env file ada di backend folder
2. Verify GROQ_API_KEY sudah diisi
3. Restart server: npm run dev
```

### Error: "File upload failed"
```
Solution:
1. Check folder exists: backend/public/uploads/tiktok_live_reports/
2. Verify permissions: chmod 755 backend/public/uploads
3. Check disk space
4. Verify multer config di routes
```

### Error: "OCR extraction failed"
```
Solution:
1. Verify API keys valid dan tidak expired
2. Check network connectivity
3. Verify image file size < 10MB
4. Check API quota (Groq/Gemini)
5. Try fallback mechanism (Groq → Gemini)
```

### Error: "Table doesn't exist"
```
Solution:
1. Manual run migration:
   cd backend && node migrate.js
2. Check database: mysql -u root -p whatsapp_system
3. Verify table created:
   SHOW TABLES LIKE 'tiktok_live%';
```

### Frontend shows "Failed to upload"
```
Solution:
1. Check backend server running: http://localhost:3000/health
2. Verify CORS config di server.js
3. Check network tab di DevTools
4. Verify user_id being sent
```

## 📊 Database Verification

```sql
-- Check tiktok_live_reports table
USE whatsapp_system;

-- See table structure
DESCRIBE tiktok_live_reports;

-- Count records
SELECT COUNT(*) FROM tiktok_live_reports;

-- View recent reports
SELECT id, report_title, ocr_confidence, status, created_at 
FROM tiktok_live_reports 
ORDER BY created_at DESC 
LIMIT 5;

-- Check file storage
-- Files should be in: backend/public/uploads/tiktok_live_reports/
```

## 📁 File Checklist

```
backend/
✅ routes/tiktokLiveReportRoutes.js (NEW)
✅ services/ocrService.js (NEW)
✅ db_tiktok.js (MODIFIED - added table)
✅ server.js (MODIFIED - added route)
✅ package.json (updated with uuid if needed)

frontend/
✅ src/components/tiktok/TikTokLiveReport/TikTokLiveReportPage.tsx (NEW)
✅ src/components/tiktok/TikTokLiveReport/index.ts (NEW)
✅ src/services/tiktokLiveReportService.ts (NEW)
✅ src/components/Sidebar.tsx (MODIFIED - added menu)
✅ src/pages/MainApp.tsx (MODIFIED - added route)
```

## 🎓 Architecture Overview

```
User Upload
    ↓
Frontend: TikTokLiveReportPage (React)
    ↓
API: POST /api/tiktok-live-reports/upload
    ↓
Backend: tiktokLiveReportRoutes
    ↓
File: Saved to /uploads/tiktok_live_reports/
    ↓
OCR Service: ocrService.js
    ├→ Try Groq API (Groq Vision)
    └→ Fallback Gemini (Gemini 2.0 Flash)
    ↓
Extracted Text
    ↓
Database: tiktok_live_reports table
    ↓
Response: Return to Frontend
    ↓
Frontend: Display in table with edit/view/delete options
```

## 📞 Need Help?

1. Check logs: `npm run dev` di backend terminal
2. Check browser console: F12 → Console tab
3. Check network requests: F12 → Network tab
4. Verify .env configuration
5. Verify database connectivity
6. Check API key validity

## 🎉 Success Indicators

Ketika setup berhasil:
- ✅ Menu "Laporan Live TikTok" muncul di sidebar
- ✅ Bisa upload gambar tanpa error
- ✅ Teks terekstrak dan ditampilkan
- ✅ Data tersimpan ke database
- ✅ Bisa edit, view, delete laporan
- ✅ Tidak ada error di console (frontend & backend)

---

**Estimated Setup Time**: 15-20 minutes
**Last Updated**: 22 Mei 2024
