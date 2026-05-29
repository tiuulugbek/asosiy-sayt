#!/bin/bash
# admin.acoustic.uz qaysi serverga borishini va bu serverda qaysi root ishlatilishini aniqlash.
# Serverda: bash deploy/diagnose-admin-domain.sh
set -euo pipefail

DOMAIN="admin.acoustic.uz"
PROD_DIR="/var/www/admin.acoustic.uz"

echo "=== 1. admin.acoustic.uz qaysi IP ga yo'naltirilgan? ==="
echo "   (Bu IP srv1196784 ning public IP si bo'lishi kerak)"
dig +short "$DOMAIN" A 2>/dev/null || nslookup "$DOMAIN" 2>/dev/null | grep -A1 "Name:" || getent hosts "$DOMAIN" 2>/dev/null || echo "dig/nslookup topilmadi"
echo ""

echo "=== 2. Bu serverning public IP si ==="
curl -sS --max-time 2 ifconfig.me 2>/dev/null || curl -sS --max-time 2 icanhazip.com 2>/dev/null || echo "(tashqi IP aniqlanmadi)"
echo ""

echo "=== 3. Nginx: admin.acoustic.uz qaysi root dan xizmat qiladi? ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -B 2 -A 25 "server_name $DOMAIN" | head -60
else
  echo "   nginx topilmadi"
fi
echo ""

echo "=== 4. /etc/nginx da admin yoki acoustic uchun konfig fayllar ==="
grep -l "admin.acoustic\|acoustic.uz" /etc/nginx/sites-enabled/* 2>/dev/null || \
grep -l "admin.acoustic\|acoustic.uz" /etc/nginx/conf.d/*.conf 2>/dev/null || \
find /etc/nginx -name "*.conf" -exec grep -l "admin.acoustic\|server_name.*acoustic" {} \; 2>/dev/null || echo "   (topilmadi)"
echo ""

echo "Xulosa: Agar 1 va 2 da turli IP bo'lsa — domen boshqa serverga yo'nalgan, deploy o'sha serverda qilinadi."
echo "Agar 3 da root boshqa papka (masalan /var/www/admins.acoustic.uz) bo'lsa — deploy shu papkaga yoki nginx root ni $PROD_DIR qilish kerak."
