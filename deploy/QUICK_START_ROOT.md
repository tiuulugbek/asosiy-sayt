# Root dan Production - Tezkor Boshlash

## ✅ Nima qilingan

1. ✅ PM2 `ecosystem.config.js` `/var/www/acoustic.uz` uchun yangilandi
2. ✅ Deployment skriptlari yaratildi
3. ✅ Qo'llanma yaratildi

## 🚀 Tezkor ishga tushirish

### Variant 1: To'liq deployment skripti

```bash
cd /var/www/acoustic.uz
bash deploy/deploy-from-root.sh
```

### Variant 2: PM2 ni yangilash

```bash
cd /var/www/acoustic.uz
bash deploy/update-pm2-to-root.sh
```

### Variant 3: Manual (agar permission muammosi bo'lsa)

```bash
# 1. PM2 ni tozalash
pm2 kill
rm -rf /root/.pm2

# 2. PM2 ni qayta ishga tushirish
cd /var/www/acoustic.uz
pm2 start deploy/ecosystem.config.js
pm2 save

# 3. Statusni tekshirish
pm2 list
```

## 📋 Konfiguratsiya

- **Backend**: `/var/www/acoustic.uz/apps/backend/dist/main.js`
- **Frontend**: `/var/www/acoustic.uz/apps/frontend` (npm start)
- **Portlar**: Backend 3001, Frontend 3002
- **Loglar**: `/var/log/pm2/`

## 🔍 Tekshirish

```bash
# PM2 status
pm2 list

# Loglar
pm2 logs acoustic-backend --lines 20
pm2 logs acoustic-frontend --lines 20

# HTTP
curl http://localhost:3001/api/health
curl http://localhost:3002
```

## ⚠️ Muammo bo'lsa

Batafsil qo'llanma: `deploy/SETUP_ROOT_PRODUCTION.md`
