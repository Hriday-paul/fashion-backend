-- Add columns as nullable first
ALTER TABLE "product_views" ADD COLUMN "productKey" TEXT;
ALTER TABLE "product_views" ADD COLUMN "userkey" TEXT;

-- Backfill existing rows using your existing columns
UPDATE "product_views" SET "productKey" = "productId" WHERE "productKey" IS NULL;
UPDATE "product_views" SET "userkey" = COALESCE("userId", 'guest') WHERE "userkey" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "product_views" ALTER COLUMN "productKey" SET NOT NULL;
ALTER TABLE "product_views" ALTER COLUMN "userkey" SET NOT NULL;