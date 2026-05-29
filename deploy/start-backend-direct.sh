#!/bin/bash

# Backend ni to'g'ridan-to'g'ri ishga tushirish (PM2 muammosi bo'lsa)

set -e

PROJECT_ROOT="/var/www/acoustic.uz"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

echo "🚀 Backend ni to'g'ridan-to'g'ri ishga tushirish..."
echo ""

# 1. Eski processlarni o'chirish
echo "🛑 1. Eski backend processlarni o'chirish..."
pkill -9 -f "node.*dist/main.js" 2>/dev/null || true
sleep 2

# 2. Port 3001 ni tekshirish
echo "🔍 2. Port 3001 ni tekshirish..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "   ⚠️  Port 3001 hali ham band"
    fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
else
    echo "   ✅ Port 3001 bo'sh"
fi

# 3. Backend ni ishga tushirish
echo "🚀 3. Backend ni ishga tushirish..."
cd "$BACKEND_DIR"

# Environment variables ni yuklash
export NODE_ENV=production
export PORT=3001

# Backend ni background da ishga tushirish
nohup node dist/main.js > /var/log/pm2/acoustic-backend-out.log 2> /var/log/pm2/acoustic-backend-error.log &
BACKEND_PID=$!

sleep 3

# 4. Tekshirish
echo "🔍 4. Backend ni tekshirish..."
if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✅ Backend ishga tushdi (PID: $BACKEND_PID)"
    
    # HTTP test
    sleep 2
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "   ✅ Backend HTTP ishlayapti"
    else
        echo "   ⚠️  Backend HTTP ishlamayapti (database muammosi bo'lishi mumkin)"
    fi
    
    # Uploads test
    if curl -s -I http://localhost:3001/uploads/2026-01-15-1768452603047-blob-s2k16h.webp 2>&1 | grep -q "200\|404"; then
        echo "   ✅ Uploads endpoint ishlayapti"
    else
        echo "   ⚠️  Uploads endpoint ishlamayapti"
    fi
    
    echo ""
    echo "📋 Backend ma'lumotlari:"
    echo "   PID: $BACKEND_PID"
    echo "   Loglar: /var/log/pm2/acoustic-backend-out.log"
    echo "   Error loglar: /var/log/pm2/acoustic-backend-error.log"
    echo ""
    echo "📝 Keyingi qadamlar:"
    echo "   - Loglarni ko'rish: tail -f /var/log/pm2/acoustic-backend-out.log"
    echo "   - Processni o'chirish: kill $BACKEND_PID"
    echo "   - Status: ps aux | grep $BACKEND_PID"
else
    echo "   ❌ Backend ishga tushmadi"
    echo "   Error loglar:"
    tail -20 /var/log/pm2/acoustic-backend-error.log 2>/dev/null || true
fi

echo ""
echo "✅ Tugallandi!"
