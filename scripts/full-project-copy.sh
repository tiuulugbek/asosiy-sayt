#!/bin/bash
# To'liq proyekt nusxasi (backup) — hech narsa o'chirilmaydi, faqat arxiv yaratiladi.
# Ishga tushirish: ./scripts/full-project-copy.sh   yoki   bash scripts/full-project-copy.sh
# Natija: /var/www/acoustic.uz/backups/acoustic.uz-full-YYYYMMDD-HHMMSS.tar.gz

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUPS_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="acoustic.uz-full-${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${BACKUPS_DIR}/${ARCHIVE_NAME}"

mkdir -p "$BACKUPS_DIR"
cd "$PROJECT_ROOT"

echo "=== To'liq proyekt nusxasi ==="
echo "Proyekt: $PROJECT_ROOT"
echo "Arxiv: $ARCHIVE_PATH"
echo ""

# node_modules, .next, dist, .turbo, coverage va katta build/cache larni chiqarib tashlash (keyin pnpm install va build bilan tiklanadi)
# .env ni kiritamiz (parollar bor) — xavfsizlik uchun faqat backup saqlash joyini himoya qiling
tar --create --gzip --file="$ARCHIVE_PATH" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.turbo' \
  --exclude='coverage' \
  --exclude='*.log' \
  --exclude='.cache' \
  --exclude='.pnpm-store' \
  --exclude='backups' \
  .

echo "Tayyor: $ARCHIVE_PATH"
echo "Hajm: $(du -h "$ARCHIVE_PATH" | cut -f1)"
echo ""
echo "Tiklash uchun: tar -xzf $ARCHIVE_PATH -C /path/to/destination"
