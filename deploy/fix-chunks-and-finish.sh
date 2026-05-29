#!/bin/bash
# Chunk 400 xatolarini bartaraf etish va frontendni to'liq yangilash
# Ishlatish: sudo bash /var/www/acoustic.uz/deploy/fix-chunks-and-finish.sh

set -e
FRONTEND_DIR="/var/www/acoustic.uz/apps/frontend"
NGINX_CONF="/var/www/acoustic.uz/deploy/nginx-acoustic-uz-new-server.conf"
NGINX_DEST="/etc/nginx/sites-available/acoustic-uz.conf"

echo "=== 1. Nginx konfigini yangilash ==="
cp "$NGINX_CONF" "$NGINX_DEST"
nginx -t && systemctl reload nginx
echo "   Nginx reload qilindi."

echo ""
echo "=== 2. Port 3000 da boshqa process yo'qligini tekshirish ==="
lsof -i :3000 || true

echo ""
echo "=== 3. Frontend: toza build ==="
cd "$FRONTEND_DIR"
rm -rf .next
npm run build
echo "   Build tugadi."

echo ""
echo "=== 4. PM2 restart ==="
cd /var/www/acoustic.uz
pm2 restart acoustic-frontend
sleep 2
pm2 list | grep -E "acoustic-frontend|name"

echo ""
echo "=== Tugadi ==="
echo "   Brauzerda: Ctrl+Shift+R (hard refresh) yoki sahifa ma'lumotlarini tozalab yangilang."
echo "   Chunk'lar endi /_next/ yoki /next/ (nginx rewrite) orqali yuklanishi kerak."
