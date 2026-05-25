#!/bin/bash

# 🚀 Quick Setup Script untuk TikTok Live Report Feature
# Jalankan: bash setup-tiktok-live-report.sh

echo "🚀 TikTok Live Report - Quick Setup"
echo "=================================="
echo ""

# Check if running from project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Jalankan script ini dari root project directory"
    echo "   di mana ada folder 'backend' dan 'frontend'"
    exit 1
fi

echo "✅ Direktori project terdeteksi"
echo ""

# Step 1: Backend dependencies
echo "📦 Step 1: Installing backend dependencies..."
cd backend

# Check if uuid is in package.json
if ! grep -q '"uuid"' package.json; then
    echo "  Adding uuid to dependencies..."
    npm install uuid
fi

npm install
echo "✅ Backend dependencies installed"
echo ""

# Step 2: Setup .env
echo "⚙️  Step 2: Checking .env configuration..."
if [ ! -f ".env" ]; then
    echo "  Creating .env file..."
    cat > .env << 'EOF'
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_system

# API Keys - HARUS DIISI
GROQ_API_KEY=
GEMINI_API_KEY=

# Server Config
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
EOF
    echo "  ⚠️  .env created - EDIT GROQ_API_KEY dan GEMINI_API_KEY!"
else
    echo "  ✅ .env already exists"
fi
echo ""

# Step 3: Check database
echo "🗄️  Step 3: Checking database..."
echo "  Run migration manually: node migrate.js"
echo ""

# Step 4: Frontend dependencies
echo "📦 Step 4: Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Go back to root
cd ..

echo "✅ Setup Completed!"
echo ""
echo "📋 Next Steps:"
echo "  1. Edit backend/.env dan isi GROQ_API_KEY & GEMINI_API_KEY"
echo "  2. Buka 2 terminal:"
echo "     - Terminal 1: cd backend && npm run dev"
echo "     - Terminal 2: cd frontend && npm run dev"
echo "  3. Buka http://localhost:5173"
echo "  4. Login dan cari menu 'Laporan Live TikTok' di sidebar"
echo ""
echo "🎓 Dokumentasi lengkap: TIKTOK_LIVE_REPORT_SETUP.md"
echo ""
