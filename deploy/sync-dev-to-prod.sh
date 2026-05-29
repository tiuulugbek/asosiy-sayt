#!/bin/bash
# Development'dan Production'ga avtomatik sync

set -e

DEV_DIR="/var/www/acoustic.uz"
PROD_DIR="/var/www/acoustic.uz"
BACKUP_DIR="/var/www/acoustic.uz.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔄 Development'dan Production'ga sync qilish..."
echo ""

# 1. Backup
echo "💾 1. Production backup qilish..."
if [ -d "$PROD_DIR" ]; then
    echo "   Backup: $BACKUP_DIR"
    cp -r "$PROD_DIR" "$BACKUP_DIR" 2>/dev/null || true
    echo "   ✅ Backup yaratildi"
else
    echo "   ⚠️  Production folder topilmadi"
fi
echo ""

# 2. Kodlarni ko'chirish (node_modules va dist'siz)
echo "📦 2. Kodlarni ko'chirish..."
rsync -av --delete \
  "$DEV_DIR/" \
  "$PROD_DIR/" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='backups'

echo "   ✅ Kodlar ko'chirildi"
echo ""

# 3. Permission'lar
echo "🔐 3. Permission'larni to'g'rilash..."
chown -R acoustic:acoustic "$PROD_DIR" 2>/dev/null || chown -R nobody:nogroup "$PROD_DIR"
echo "   ✅ Permission'lar to'g'rilandi"
echo ""

# 4. Build qilish (acoustic user sifatida)
echo "🔨 4. Build qilish..."
echo "   ⚠️  Keyingi qadamlarni acoustic user sifatida bajarish kerak:"
echo ""
echo "   su - acoustic"
echo "   cd /var/www/acoustic.uz"
echo "   pnpm --filter @acoustic/shared build"
echo "   npx prisma@5.22.0 generate --schema=./prisma/schema.prisma"
echo "   cd apps/backend && pnpm build"
echo "   cd ../frontend && pnpm build"
echo "   pm2 restart all"
echo ""

echo "✅ Sync yakunlandi!"
echo "📁 Backup: $BACKUP_DIR"
