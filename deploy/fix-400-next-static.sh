#!/bin/bash
# 400 Bad Request — /_next/static CSS va JS chunk'lari uchun to'liq tuzatish
# Ishlatish: sudo bash /var/www/acoustic.uz/deploy/fix-400-next-static.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== 400 Bad Request tuzatish — /_next/static ===${NC}"
echo ""

# 1. Port 3000 da bitta process ishlashini ta'minlash
echo -e "${YELLOW}1. Port 3000 tekshiruv...${NC}"
PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "   Port 3000 da process(lar): $PIDS"
    echo "   PM2 orqali restart qilamiz..."
    cd /var/www/acoustic.uz
    pm2 stop acoustic-frontend 2>/dev/null || true
    sleep 2
    # Qolgan processlarni to'xtatish
    for pid in $PIDS; do
        if [ "$pid" != "$$" ]; then
            kill -9 $pid 2>/dev/null || true
        fi
    done
    sleep 2
fi
echo -e "${GREEN}   ✓${NC}"
echo ""

# 2. Frontend toza build
echo -e "${YELLOW}2. Frontend toza build...${NC}"
cd /var/www/acoustic.uz/apps/frontend

# fetch-cache tozalash (rm -rf .next xatosini oldini olish)
rm -rf .next/cache/fetch-cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true

export NODE_ENV=production
export NEXT_PUBLIC_API_URL="https://a.acoustic.uz/api"
export NEXT_PUBLIC_SITE_URL="https://acoustic.uz"
pnpm run build

echo -e "${GREEN}   ✓ Build tugadi${NC}"
echo ""

# 3. Static fayllar mavjudligini tekshirish
echo -e "${YELLOW}3. Static fayllar tekshiruv...${NC}"
if [ -d ".next/static" ]; then
    CSS_COUNT=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
    CHUNK_COUNT=$(find .next/static/chunks -name "*.js" 2>/dev/null | wc -l)
    echo "   CSS fayllar: $CSS_COUNT"
    echo "   Chunk fayllar: $CHUNK_COUNT"
else
    echo -e "${RED}   ❌ .next/static papka topilmadi!${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓${NC}"
echo ""

# 4. Nginx konfigini yangilash
echo -e "${YELLOW}4. Nginx konfigini yangilash...${NC}"
NGINX_SOURCE="/var/www/acoustic.uz/deploy/nginx-acoustic-uz-new-server.conf"
NGINX_DEST="/etc/nginx/sites-available/acoustic-uz.conf"

if [ -f "$NGINX_SOURCE" ]; then
    cp "$NGINX_SOURCE" "$NGINX_DEST"
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo -e "${GREEN}   ✓ Nginx reload qilindi${NC}"
    else
        echo -e "${RED}   ❌ Nginx test xato. Konfigni qo'lda tekshiring.${NC}"
        nginx -t
    fi
else
    echo -e "${YELLOW}   ⚠ Nginx source topilmadi, mavjud konfig ishlatiladi${NC}"
fi
echo ""

# 5. PM2 restart
echo -e "${YELLOW}5. PM2 restart...${NC}"
cd /var/www/acoustic.uz
pm2 restart acoustic-frontend
sleep 3
pm2 list | grep -E "acoustic|name" || true
echo -e "${GREEN}   ✓ PM2 ishga tushdi${NC}"
echo ""

# 6. Lokal tekshiruv
echo -e "${YELLOW}6. Lokal tekshiruv (curl)...${NC}"
sleep 2
CSS_FILE=$(ls -1 apps/frontend/.next/static/css/*.css 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    CSS_BASENAME=$(basename "$CSS_FILE")
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/_next/static/css/$CSS_BASENAME" 2>/dev/null || echo "000")
    echo "   /_next/static/css/$CSS_BASENAME → HTTP $HTTP_CODE"
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}   ✓ Lokal test muvaffaqiyatli${NC}"
    else
        echo -e "${YELLOW}   ⚠ Lokal HTTP $HTTP_CODE (nginx orqali tekshiring)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠ CSS fayl topilmadi${NC}"
fi
echo ""

echo -e "${GREEN}=== Tugadi ===${NC}"
echo ""
echo "Keyingi qadamlar:"
echo "  1. Brauzerda hard refresh: Ctrl+Shift+R (yoki Cmd+Shift+R)"
echo "  2. https://acoustic.uz/ramazon-chegirmasi oching"
echo "  3. Agar xato davom etsa: DevTools → Network → 'Disable cache' belgilab qayta yangilang"
echo "  4. Nginx error log: tail -f /var/log/nginx/acoustic.uz.error.log"
echo ""
