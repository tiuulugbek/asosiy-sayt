# Frontend Fondada Ishga Tushirish

## 📝 Scriptlar

1. **start-frontend-background.sh** - Frontend'ni fonda ishga tushirish
2. **stop-frontend.sh** - Frontend'ni to'xtatish
3. **frontend-status.sh** - Frontend holatini ko'rish

## 🚀 Foydalanish

### Fondada ishga tushirish:
```bash
cd /var/www/acoustic.uz
./deploy/start-frontend-background.sh
```

### To'xtatish:
```bash
./deploy/stop-frontend.sh
```

### Holatni ko'rish:
```bash
./deploy/frontend-status.sh
```

### Loglarni ko'rish:
```bash
tail -f /tmp/acoustic-frontend.log
```

## ⚠️ MUAMMO

Port 3000'ga ruxsat yo'q (EPERM). Bu muammo hal qilinguncha frontend ishlamaydi.

## 💡 YECHIM

1. Port'ni o'zgartirish (masalan 3003)
2. Server administrator bilan bog'lanish
