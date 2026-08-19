/*
  Warnings:

  - The values [PENDING_REVIEW] on the enum `ReturnStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReturnStatus_new" AS ENUM ('REQUESTED', 'APPROVED', 'DECLINED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."returns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "returns" ALTER COLUMN "status" TYPE "ReturnStatus_new" USING ("status"::text::"ReturnStatus_new");
ALTER TYPE "ReturnStatus" RENAME TO "ReturnStatus_old";
ALTER TYPE "ReturnStatus_new" RENAME TO "ReturnStatus";
DROP TYPE "public"."ReturnStatus_old";
ALTER TABLE "returns" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "courier_service_id" TEXT,
ADD COLUMN     "isLebelGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lebelUrl" TEXT,
ADD COLUMN     "parcelId" TEXT,
ADD COLUMN     "shippingId" TEXT;
