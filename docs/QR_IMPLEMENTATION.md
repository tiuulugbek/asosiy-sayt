# Acoustic QR Implementation Summary

## Existing Stack Reused
- Backend: NestJS + Prisma + PostgreSQL (`apps/backend`)
- Existing branch source of truth: `Branch` model/table in shared Acoustic DB
- Existing deployment style: domain-based reverse proxy and `/api` backend prefix

## New Modules
- Backend QR module: `apps/backend/src/qr`
  - `POST /api/qr-auth/login`, `POST /api/qr-auth/logout`, `GET /api/qr-auth/me`
  - `GET /api/qr/branches` (branch source reuse from existing Branch table)
  - `GET/POST/PATCH/DELETE /api/qr-codes`
  - `GET /api/qr-analytics/summary`
  - `GET /api/qr-analytics/branch-performance`
  - `GET /api/qr-analytics/landing-pages`
  - `GET /r/:code` tracked redirect
  - `GET/POST/PATCH /api/qr-access/accounts*` (super admin only)
- Frontend QR admin: `apps/qr-admin`
  - split-screen login
  - KPI cards + QR table + branch performance table

## Branch Scope Enforcement
- Server guard sets `qrUser` from cookie token.
- Branch accounts are restricted by server-side checks against `branchId`.
- Super admin bypasses branch scope.

## Display IDs
- Database IDs are integer (`SERIAL` / `Int @id @default(autoincrement())`).
- Display IDs are padded in service layer (`001`, `015`, etc.).
