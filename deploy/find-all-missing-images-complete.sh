#!/bin/bash
echo "🔍 Barcha yo'qolgan rasmlarni to'liq qidirish..."
echo ""

cd /var/www/acoustic.uz

# Database'dan barcha URL'larni olish
PGPASSWORD='PAROL_ENV_DAN_OLINADI' psql -h localhost -p 5432 -U acoustic_user -d acousticwebdb -t -c 'SELECT url FROM "Media" WHERE url LIKE '\''%/uploads/%'\'' ORDER BY "createdAt" DESC;' 2>/dev/null | while read url; do
    if [ -n "$url" ]; then
        filename=$(echo "$url" | sed 's|/uploads/||')
        
        # Barcha joylarda qidirish
        found=false
        for dir in \
            "/var/www/acoustic.uz/apps/backend/uploads" \
            "/var/www/acoustic.uz/apps/backend/apps/backend/uploads" \
            "/var/www/acoustic.uz/apps/backend/uploads" \
            "/var/www/acoustic.uz/apps/backend/apps/backend/uploads" \
            "/var/www/acoustic.uz/uploads" \
            "/var/www/acoustic.uz/uploads" \
            "/var/www/acoustic.uz.backup.20260123_231125/apps/backend/uploads" \
            "/var/www/acoustic.uz.backup.20260123_231125/apps/backend/apps/backend/uploads"; do
            if [ -f "$dir/$filename" ] 2>/dev/null; then
                found=true
                break
            fi
        done
        
        if [ "$found" = false ]; then
            echo "❌ Yo'qolgan: $filename"
        fi
    fi
done | wc -l

echo "ta fayl yo'qolgan"
echo ""
echo "✅ Qidiruv yakunlandi"
