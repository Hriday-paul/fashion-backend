BEGIN;

-- 1. Create the new enum type
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED_TO_AUTHENTICATION_CENTRE', 'AUTHENTICATION_CENTRE_RECEIVED_ITEM', 'AUTHENTICATION_IN_PROGRESS', 'AUTHENTICATION_PASSED', 'AUTHENTICATION_FAILED', 'SHIPPED_TO_BUYER', 'DELIVERED_TO_BUYER', 'COMPLETED', 'CANCELLED');

-- 2. Add the new "status" column to OrderItem using the OLD enum type
--    (so old values like SHIPPED/DELIVERED are still valid at this point)
ALTER TABLE "OrderItem" ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- 3. Copy the existing status from order_seller_groups down to each OrderItem
--    (still using OLD enum values here — no remapping yet)
UPDATE "OrderItem" oi
SET "status" = osg."status"
FROM "order_seller_groups" osg
WHERE oi."sellerGroupId" = osg."id";

-- 4. Convert OrderItem.status to the new enum, remapping removed values as part of the cast
ALTER TABLE "OrderItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (
    CASE "status"::text
      WHEN 'SHIPPED' THEN 'SHIPPED_TO_BUYER'
      WHEN 'DELIVERED' THEN 'DELIVERED_TO_BUYER'
      ELSE "status"::text
    END
  )::"OrderStatus_new";
ALTER TABLE "OrderItem" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 5. Drop the old status column from order_seller_groups
ALTER TABLE "public"."order_seller_groups" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."order_seller_groups" DROP COLUMN "status";

-- 6. Swap the enum types
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";

COMMIT;