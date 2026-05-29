# Acoustic QR Admin

## Run
- `pnpm --filter @acoustic/qr-admin dev`
- `pnpm --filter @acoustic/qr-admin build`

## Environment
- `VITE_QR_API_URL` (default `/api`)

## Notes
- Uses branch list from backend `GET /api/qr/branches` (same Acoustic branch source).
- Auth uses `qr_access_token` httpOnly cookie.
