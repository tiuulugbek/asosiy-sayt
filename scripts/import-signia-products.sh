#!/bin/bash
# Signia mahsulotlarini import qilish

JSON_FILE="/root/signia-products-import.json"
SCRIPT_PATH="scripts/import-products-from-json.ts"

echo "=== Signia Mahsulotlarini Import Qilish ==="
echo ""

if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Fayl topilmadi: $JSON_FILE"
    exit 1
fi

echo "📂 Fayl topildi: $JSON_FILE"
echo "📊 Fayl hajmi: $(wc -l < "$JSON_FILE") qator"
echo ""

# JSON fayl to'g'ri formatda ekanligini tekshirish
if ! python3 -m json.tool "$JSON_FILE" > /dev/null 2>&1; then
    echo "⚠️ JSON fayl formatida xatolik bor. Tekshiryapmiz..."
    python3 -m json.tool "$JSON_FILE" 2>&1 | head -10
    exit 1
fi

echo "✅ JSON fayl formati to'g'ri"
echo ""

# Mahsulotlar sonini hisoblash
PRODUCT_COUNT=$(python3 -c "import json; data = json.load(open('$JSON_FILE')); print(len(data))" 2>/dev/null || echo "0")
echo "📦 Mahsulotlar soni: $PRODUCT_COUNT"
echo ""

# Import qilish
echo "🚀 Import boshlandi..."
echo ""

cd /var/www/acoustic.uz
pnpm exec ts-node "$SCRIPT_PATH" "$JSON_FILE" --brand-name "Signia"

echo ""
echo "✅ Import yakunlandi"
