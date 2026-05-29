# Personal AI Operator ↔ acoustic.uz

## Tezkor `.env` (yordamchingizga bering)

Fayl: `apps/backend/.env.ai-operator` (setup skriptdan keyin yaratiladi)

```env
ACOUSTIC_API_BASE_URL=https://a.acoustic.uz/api
ACOUSTIC_PUBLIC_BASE_URL=https://acoustic.uz
ACOUSTIC_API_TOKEN=<64-hex>
ACOUSTIC_DEFAULT_CATEGORY_SLUG=eshitish-muammolari
ACOUSTIC_WEBHOOK_SECRET=<32-hex>
```

Docker ichida: `ACOUSTIC_API_BASE_URL=http://host.docker.internal:3001/api`

## Endpointlar

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/auth/whoami` | Bearer |
| GET | `/api/categories` | Bearer |
| GET | `/api/tags?q=` | Bearer |
| POST | `/api/articles` | Bearer |
| PATCH | `/api/articles/:id` | Bearer |
| GET | `/api/articles?author=me` | Bearer |
| DELETE | `/api/articles/:id` | Bearer |
| POST | `/api/media/images` | Bearer multipart |
| POST | `/api/media/images/from-url` | Bearer JSON |

Maqola URL: `https://acoustic.uz/posts/{slug}`

## O‘rnatish (server)

```bash
cd /var/www/acoustic.uz
pnpm --filter @acoustic/shared build
cd apps/backend && pnpm run db:migrate:deploy
pnpm exec ts-node --transpile-only ../../scripts/setup-ai-operator.ts
pnpm run build && pm2 restart acoustic-backend
```

Batafsil: repodagi integratsiya spetsifikatsiyasi va `apps/backend/src/integration/`.
