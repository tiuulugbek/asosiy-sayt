#!/bin/bash

# Port 3001 muammosini hal qilish va backend ni to'g'ri ishga tushirish

set -e

echo "🔧 Port 3001 muammosini hal qilish..."
echo ""

# 1. Barcha backend processlarni o'chirish
echo "🛑 1. Barcha backend processlarni o'chirish..."
pkill -9 -f "node.*dist/main.js" 2>/dev/null || true
sleep 2

# 2. Port 3001 ni tekshirish
echo "🔍 2. Port 3001 ni tekshirish..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "   ⚠️  Port 3001 hali ham band"
    lsof -i :3001
    echo "   Processlarni o'chirish..."
    fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
else
    echo "   ✅ Port 3001 bo'sh"
fi

# 3. PM2 daemon ni qayta ishga tushirish
echo "🔄 3. PM2 daemon ni qayta ishga tushirish..."
pkill -9 -f "PM2.*God Daemon.*root" 2>/dev/null || true
sleep 2
rm -rf /root/.pm2/*.sock /root/.pm2/pm2.log 2>/dev/null || true

# 4. Backend ni to'g'ridan-to'g'ri ishga tushirish (test)
echo "🚀 4. Backend ni to'g'ridan-to'g'ri ishga tushirish (test)..."
cd /var/www/acoustic.uz/apps/backend

# Background da ishga tushirish
nohup node dist/main.js > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
sleep 3

# 5. Tekshirish
echo "🔍 5. Backend ni tekshirish..."
if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✅ Backend ishga tushdi (PID: $BACKEND_PID)"
    
    # HTTP test
    sleep 2
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "   ✅ Backend HTTP ishlayapti"
    else
        echo "   ⚠️  Backend HTTP ishlamayapti"
    fi
    
    # Uploads test
    if curl -s -I http://localhost:3001/uploads/2026-01-15-1768452603047-blob-s2k16h.webp 2>&1 | grep -q "200\|404"; then
        echo "   ✅ Uploads endpoint ishlayapti"
    else
        echo "   ⚠️  Uploads endpoint ishlamayapti"
    fi
    
    # Processni o'chirish (PM2 ga qo'shish uchun)
    echo ""
    echo "🛑 Backend ni o'chirish (PM2 ga qo'shish uchun)..."
    kill $BACKEND_PID 2>/dev/null || true
    sleep 1
else
    echo "   ❌ Backend ishga tushmadi"
    echo "   Loglar:"
    tail -20 /tmp/backend-test.log 2>/dev/null || true
fi

# 6. PM2 ni qayta ishga tushirish
echo ""
echo "🔄 6. PM2 ni qayta ishga tushirish..."
cd /var/www/acoustic.uz

# PM2 ni ishga tushirish (daemon yaratish uchun)
pm2 list >/dev/null 2>&1 || true
sleep 1

# Backend ni PM2 orqali ishga tushirish
if pm2 start deploy/ecosystem.config.js --only acoustic-backend 2>&1 | grep -q "acoustic-backend"; then
    echo "   ✅ Backend PM2 orqali ishga tushdi"
    pm2 save
else
    echo "   ⚠️  PM2 orqali ishga tushirishda muammo"
    echo "   Qo'lda ishga tushirish:"
    echo "   cd /var/www/acoustic.uz/apps/backend"
    echo "   nohup node dist/main.js > /var/log/pm2/acoustic-backend-out.log 2>&1 &"
fi

echo ""
echo "✅ Tugallandi!"
echo ""
echo "📋 Tekshirish:"
echo "   pm2 list"
echo "   pm2 logs acoustic-backend"
echo "   curl http://localhost:3001/api/health"
