#!/bin/bash
# Serverda ishga tushiring: bash deploy/check-admin-served.sh
# admin.acoustic.uz qaysi versiya / qaysi JS berayotganini tekshiradi.
set -euo pipefail

PROD_DIR="${ADMIN_PROD_DIR:-/var/www/acoustic.uz/apps/admin/dist}"
DOMAIN="${ADMIN_DOMAIN:-https://admin.acoustic.uz}"

echo "=== 1. Lokal papkadagi fayl (nginx to'g'ridan-to'g'ri shu papkadan beradi) ==="
if [ -f "$PROD_DIR/index.html" ]; then
  echo "  index.html ichidagi JS:"
  grep -oE 'src="[^"]+\.js"' "$PROD_DIR/index.html" || true
  echo "  version.json:"
  cat "$PROD_DIR/version.json" 2>/dev/null || echo "  (yo'q)"
else
  echo "  Papka yoki index.html topilmadi: $PROD_DIR"
fi
echo ""

echo "=== 2. Domen orqali so'rov (curl $DOMAIN/) ==="
HTML=$(curl -sL -H "Cache-Control: no-cache" -H "Pragma: no-cache" "$DOMAIN/" 2>/dev/null || true)
if [ -n "$HTML" ]; then
  echo "  index.html ichidagi JS (domen orqali):"
  echo "$HTML" | grep -oE 'src="[^"]+\.js"' || true
  echo "  __APP_VERSION__ (agar bor):"
  echo "$HTML" | grep -oE '__APP_VERSION__[^;]*' | head -1 || true
else
  echo "  Curl xatosi yoki bo'sh javob."
fi
echo ""

echo "=== 3. version.json domen orqali ==="
curl -sL -H "Cache-Control: no-cache" "$DOMAIN/version.json" 2>/dev/null || echo "  (olindi yoki xato)"
echo ""

echo "Agar 1 va 2 da turli JS fayl nomlari chiqsa — domen boshqa serverga yoki cache'ga yo'nalgan."
echo "Agar 1 va 2 bir xil yangi versiya bo'lsa, brauzer/proxy cache — CDN tozalang yoki boshqa tarmoqdan sinab ko'ring."
