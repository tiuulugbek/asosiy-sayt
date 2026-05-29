# Admin panel: server yangi, brauzer eski ko‘rsatadi (cache)

Agar `/var/www/admin.acoustic.uz/version.json` yangi bo‘lsa-da brauzerda eski versiya ko‘rinsa — **index.html** yoki **JS** qayerdadir cache’da.

## 1. Nginx: no-cache borligini tekshirish

Serverda:
```bash
# Qaysi konfig ishlatilayapti
nginx -T 2>/dev/null | grep -A 30 "server_name admin.acoustic.uz"
```

`location = /` va `location = /index.html` bloklarida quyidagi bo‘lishi kerak:
```nginx
add_header Cache-Control "no-cache, no-store, must-revalidate";
add_header Pragma "no-cache";
add_header Expires "0";
```

Agar yo‘q bo‘lsa, `deploy/nginx-acoustic-uz-new-server.conf` dagi admin server blokini nginx ga qo‘llang va reload qiling.

## 2. Nginx ni qayta yuklash

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 3. CDN (Cloudflare va hokazo) ishlatilsa

Cloudflare yoki boshqa CDN ishlatilsa, **admin.acoustic.uz** uchun cache’ni tozalang (Purge Cache). CDN no-cache header’larni e’tiborsiz qoldirib, eski index.html ni berishi mumkin.

## 4. Brauzerda tekshirish

1. https://admin.acoustic.uz oching.
2. **F12** → **Network** tab.
3. **Disable cache** belgilang, sahifani **Ctrl+Shift+R** bilan yangilang.
4. **index.html** qatorini bosing: **Response Headers** da `Cache-Control: no-cache, no-store, must-revalidate` bo‘lishi kerak va **size** “(disk cache)” emas, haqiqiy bayt bo‘lishi kerak.

## 5. Bir martalik: index.html ni yangilab cache’ni buzish

Agar hali ham eski ko‘rinsa, index.html faylining “muddati”ni o‘zgartirib, ba’zi proxy/cache’larni majburlash mumkin (serverda):
```bash
sudo touch /var/www/admin.acoustic.uz/index.html
sudo systemctl reload nginx
```
Keyin brauzerda yana **Ctrl+Shift+R** qiling.
