# Rasm yuklash — zanjir va tekshiruv

## Zanjir (admin → backend)

1. **Admin panel** (admin.acoustic.uz): foydalanuvchi rasm tanlaydi → `uploadMedia()` chaqiriladi.
2. **So‘rov:** `POST /api/media` (admin da API_BASE = `/api`), `credentials: 'include'` (cookie yuboriladi), body: `FormData` (file + ixtiyoriy alt_uz, alt_ru).
3. **Nginx** (admin.acoustic.uz): `location /api/` → `proxy_pass http://localhost:3001/api/`. Cookie va body backend ga uzatiladi.
4. **Backend** (NestJS, port 3001): `POST /api/media` — `JwtAuthGuard` + `media.write` ruxsati, `FileInterceptor('file')`, 10MB gacha, faqat `image/*`.

## Qilingan tuzatishlar

- Admin: **PATCH** → **POST** (`/auth/login`, `/auth/refresh`, `/media`).
- Nginx (admin.acoustic.uz) `location /api/`:
  - `client_max_body_size 50M` — katta rasmlar 413 bermasligi uchun.
  - `proxy_set_header Cookie $http_cookie` — sessiya backend ga uzatilishi uchun.
  - `proxy_*_timeout 60s` — uzoq yuklashlar uchun.

## Logda nima ko‘rinadi

- **Rasm yuklanganda** backend logida quyidagilar chiqishi kerak:
  - `"method":"POST","url":"/api/media"` (yoki `/api/media` path)
  - `Upload request received. File: ... Size: ...`
- Agar bu xabarlar **umuman chiqmasa** — so‘rov backend ga yetmayapti (admin noto‘g‘ri URL, nginx 404, yoki yuklash hali sinab ko‘rilmagan).

## Agar hali ishlamasa

1. **Brauzer (F12 → Network):**
   - `POST .../api/media` qatorini oching.
   - **Status:** 401 → sessiya yo‘q yoki cookie yuborilmagan (qayta login, yoki cookie domain/path).
   - **Status:** 403 → foydalanuvchida `media.write` yo‘q.
   - **Status:** 413 → fayl juda katta (nginx/client_max_body_size).
   - **Status:** 404 → URL yoki backend marshrut noto‘g‘ri (admin to‘g‘ri build va POST ishlatayotganini tekshiring).

2. **Backend loglar:**
   ```bash
   pm2 logs acoustic-backend --lines 50
   ```
   "Upload request received" yoki "Rasm fayli yuborilmadi" / "Faqat rasm fayllari" xabarlarini qidiring.

3. **Admin build:** nginx admin root = `/var/www/acoustic.uz/apps/admin/dist`. Yangi buildni shu yerga nusxalang:
   ```bash
   cd /root/acoustic.uz && pnpm --filter @acoustic/admin build
   sudo cp -r apps/admin/dist/* /var/www/acoustic.uz/apps/admin/dist/
   sudo chown -R acoustic:acoustic /var/www/acoustic.uz/apps/admin/dist
   ```

4. **Sessiya:** Admin da chiqib, qayta kiring. Keyin yana rasm yuklashni urinib ko‘ring.
