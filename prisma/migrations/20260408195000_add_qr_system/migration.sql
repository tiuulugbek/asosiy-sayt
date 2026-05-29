-- CreateEnum
CREATE TYPE "QrAccountType" AS ENUM ('branch', 'super_admin', 'analyst');

-- CreateEnum
CREATE TYPE "QrCodeStatus" AS ENUM ('active', 'paused', 'expired');

-- CreateTable
CREATE TABLE "QrAccessAccount" (
    "id" SERIAL NOT NULL,
    "branchId" TEXT,
    "loginType" "QrAccountType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QrAccessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL DEFAULT 'external_url',
    "destinationUrl" TEXT NOT NULL,
    "internalPagePath" TEXT,
    "description" TEXT,
    "campaignName" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "status" "QrCodeStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdByAccountId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrScanEvent" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "referer" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "isUniqueScan" BOOLEAN NOT NULL DEFAULT false,
    "uniquenessKey" TEXT NOT NULL,
    "rawMetaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QrScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QrAccessAccount_branchId_idx" ON "QrAccessAccount"("branchId");
CREATE INDEX "QrAccessAccount_loginType_idx" ON "QrAccessAccount"("loginType");
CREATE UNIQUE INDEX "QrCode_uuid_key" ON "QrCode"("uuid");
CREATE UNIQUE INDEX "QrCode_code_key" ON "QrCode"("code");
CREATE INDEX "QrCode_branchId_idx" ON "QrCode"("branchId");
CREATE INDEX "QrCode_status_idx" ON "QrCode"("status");
CREATE INDEX "QrCode_createdByAccountId_idx" ON "QrCode"("createdByAccountId");
CREATE INDEX "QrScanEvent_qrCodeId_scannedAt_idx" ON "QrScanEvent"("qrCodeId", "scannedAt");
CREATE INDEX "QrScanEvent_branchId_scannedAt_idx" ON "QrScanEvent"("branchId", "scannedAt");
CREATE INDEX "QrScanEvent_uniquenessKey_scannedAt_idx" ON "QrScanEvent"("uniquenessKey", "scannedAt");

-- AddForeignKey
ALTER TABLE "QrAccessAccount" ADD CONSTRAINT "QrAccessAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "QrAccessAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QrScanEvent" ADD CONSTRAINT "QrScanEvent_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QrCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QrScanEvent" ADD CONSTRAINT "QrScanEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
