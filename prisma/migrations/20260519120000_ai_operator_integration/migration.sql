-- AI Operator integration: API tokens + post author tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "apiTokenHash" TEXT;

ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Post_createdByUserId_idx" ON "Post"("createdByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Post_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "Post"
      ADD CONSTRAINT "Post_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
