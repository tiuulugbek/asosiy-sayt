#!/bin/bash
# Admin panel: canonical build/deploy.
# Ishga tushirish: pnpm run deploy:admin   yoki   bash deploy/build-and-deploy-admin.sh
# Serverda: loyiha papkasidan (masalan /var/www/acoustic.uz) ishga tushiring.
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
BUILD_DIR="$REPO_ROOT/apps/admin/dist"
CANONICAL_DIR="${ADMIN_PROD_DIR:-/var/www/acoustic.uz/apps/admin/dist}"

echo "=============================================="
echo "  Admin panel: canonical build/deploy"
echo "=============================================="
echo "  REPO_ROOT: $REPO_ROOT"
echo "  CANONICAL_DIR: $CANONICAL_DIR  <- nginx shu papkadan beradi"
echo ""

echo "📦 1. Build..."
cd "$REPO_ROOT"
pnpm --filter @acoustic/shared build 2>/dev/null || true
pnpm --filter @acoustic/admin build
echo "   ✅ Build tugadi"
echo ""

if [ "$BUILD_DIR" != "$CANONICAL_DIR" ]; then
  echo "❌ ADMIN_PROD_DIR canonical build papkasidan farq qiladi."
  echo "   BUILD_DIR:     $BUILD_DIR"
  echo "   CANONICAL_DIR: $CANONICAL_DIR"
  echo "   admin.acoustic.uz uchun yagona target: apps/admin/dist"
  exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ] || [ ! -f "$BUILD_DIR/version.json" ]; then
  echo "❌ Build natijasi topilmadi: $BUILD_DIR"
  exit 1
fi
NEW_VERSION=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' "$BUILD_DIR/version.json" | head -1 | sed 's/.*"\([^"]*\)" *$/\1/')
echo "   Yangi versiya: $NEW_VERSION"
echo ""

echo "📤 2. Deploy..."
echo "   Nginx canonical build papkasini to'g'ridan-to'g'ri serve qiladi; qo'shimcha nusxalash yo'q."
echo "   ✅ Deploy target tayyor: $BUILD_DIR"
echo ""

# 3. Tekshiruv
PROD_VERSION=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' "$BUILD_DIR/version.json" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)" *$/\1/' || echo "")
if [ -n "$PROD_VERSION" ] && [ "$PROD_VERSION" = "$NEW_VERSION" ]; then
  echo "   ✅ Papkadagi versiya: $PROD_VERSION"
else
  echo "   ⚠️  Papkadagi versiya: $PROD_VERSION (kutilgan: $NEW_VERSION)"
fi
echo ""
echo "   Domen orqali (curl):"
CURL_VER=$(curl -sL --max-time 5 -H "Cache-Control: no-cache" "https://admin.acoustic.uz/version.json" 2>/dev/null | grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)" *$/\1/' || echo "(so'rov xato)")
if [ -n "$CURL_VER" ] && [ "$CURL_VER" = "$NEW_VERSION" ]; then
  echo "   ✅ https://admin.acoustic.uz versiyasi: $CURL_VER"
else
  echo "   ⚠️  https://admin.acoustic.uz versiyasi: $CURL_VER (papkada: $PROD_VERSION)"
  echo "   Agar turli bo'lsa — nginx boshqa root ishlatadi yoki CDN cache. Nginx: grep -r 'admin.acoustic.uz' /etc/nginx/"
fi
echo ""
echo "👉 Brauzerda: https://admin.acoustic.uz — Ctrl+Shift+R bilan yangilang."
echo ""
