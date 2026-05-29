# Acoustic QR Deployment Notes

## Domains
- QR Admin: `qr.acoustic.uz`
- Backend API (existing): expose `/api/qr-*`, `/api/qr/*`, and `/r/:code`

## Environment Variables
- `DATABASE_URL` - shared Acoustic DB (contains `Branch` source)
- `JWT_ACCESS_SECRET` - used for QR cookie signing
- `CORS_ORIGIN` - include `https://qr.acoustic.uz`

Frontend (`apps/qr-admin`):
- `VITE_QR_API_URL=/api` (recommended behind reverse proxy)

## Migrations
1. `pnpm --filter @acoustic/backend db:generate`
2. `pnpm --filter @acoustic/backend db:migrate:deploy`

QR migration:
- `prisma/migrations/20260408195000_add_qr_system/migration.sql`

## Build/Start
- Backend: `pnpm --filter @acoustic/backend build && pnpm --filter @acoustic/backend start`
- QR Admin: `pnpm --filter @acoustic/qr-admin build`

## Reverse Proxy
- Route `qr.acoustic.uz` to built `qr-admin` static files.
- Proxy `/api` to Nest backend.
- Ensure `/r/:code` reaches backend (no static override).
