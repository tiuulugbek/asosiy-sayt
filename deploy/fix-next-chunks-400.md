# 400 Bad Request — /_next/static/chunks va CSS

## Tez tuzatish (bitta buyruq)

```bash
sudo bash /var/www/acoustic.uz/deploy/fix-400-next-static.sh
```

Bu skript:
1. Port 3000 da konfliktlarni bartaraf etadi
2. Frontend toza build qiladi
3. Nginx konfigini yangilaydi
4. PM2 ni restart qiladi
5. Lokal tekshiruv qiladi

---

## Qo'lda qadamlar

### 1. Nginx yangilash

Aktiv nginx konfigida `acoustic.uz` server blokida:

- `location /_next/` bo‘lsin (faqat `/_next/static` emas)
- Ichida `proxy_set_header Host $host`, `X-Forwarded-Proto $scheme` va boshqa proxy headerlar bo‘lsin
- `proxy_cache_bypass $http_upgrade` qo‘shilsin

To‘g‘ri konfig: `deploy/nginx-acoustic-uz-new-server.conf`

```bash
sudo cp /var/www/acoustic.uz/deploy/nginx-acoustic-uz-new-server.conf /etc/nginx/sites-available/acoustic-uz.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Port 3000 da bitta process

400 davom etsa, port 3000 da bir nechta process ishlayotgan bo‘lishi mumkin:

```bash
sudo lsof -i :3000
# yoki
ss -tlnp | grep 3000
```

Agar PM2 dan boshqa PID ham ko‘rinsa:

```bash
pm2 stop acoustic-frontend
# Boshqa processlarni to'xtatish
sudo kill -9 $(lsof -ti :3000)  # ehtiyotkorlik bilan
pm2 start acoustic-frontend
```

### 3. Frontend toza build

```bash
cd /var/www/acoustic.uz/apps/frontend
rm -rf .next/cache .next
pnpm run build
pm2 restart acoustic-frontend
```

### 4. Brauzer cache

Hard refresh: **Ctrl+Shift+R** (yoki Cmd+Shift+R). Yoki DevTools → Network → "Disable cache" belgilab sahifani yangilang.

### 5. Debug

```bash
# Nginx error log
tail -f /var/log/nginx/acoustic.uz.error.log

# Lokal tekshiruv (Node to'g'ridan-to'g'ri javob beradimi)
curl -I http://127.0.0.1:3000/_next/static/css/
```
