-- Chegirma maydonlari (db push yoki migrate ishlamasa qo'lda ishlatish mumkin)
-- PostgreSQL: psql -U acoustic -d acoustic -f prisma/migrations/manual_add_product_discount.sql

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(14,2);

COMMENT ON COLUMN "Product"."discountPercent" IS '1-99 = chegirma foizi, null = yo''q';
COMMENT ON COLUMN "Product"."originalPrice" IS 'Chegirma oldingi narx (ixtiyoriy)';
