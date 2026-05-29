#!/bin/bash
# Production API da slug bo'yicha qaysi mahsulot qaytarilishini tekshirish.
# Ishga tushirish: ./scripts/check-product-by-slug-on-api.sh [slug]
# Masalan: ./scripts/check-product-by-slug-on-api.sh oticon-jet-2-bte-pp

SLUG="${1:-oticon-jet-2-bte-pp}"
API_URL="${NEXT_PUBLIC_API_URL:-https://a.acoustic.uz/api}"
URL="${API_URL}/products/slug/${SLUG}"

echo "=== API dan mahsulot (slug=${SLUG}) ==="
echo "URL: $URL"
echo ""

curl -sL "$URL" | jq -r 'if .name_uz then "Nomi (uz): \(.name_uz)\nNomi (ru): \(.name_ru)\nBrend: \(.brand.name // "—")\nSlug: \(.slug)" else "Javob: \(. | tostring)" end' 2>/dev/null || curl -sL "$URL"
