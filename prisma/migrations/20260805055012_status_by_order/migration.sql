/*
  Warnings:

  - The values [PASSED,FAILED] on the enum `OrderAuthStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `authStatus` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `currentShipTo` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `OrderItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderAuthResult" AS ENUM ('NOT_PROCESSED', 'PASSED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderAuthStatus_new" AS ENUM ('NOT_STARTED', 'ITEM_RECEIVED', 'IN_PROGRESS', 'RESPONDED');
ALTER TABLE "public"."OrderItem" ALTER COLUMN "authStatus" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "authStatus" TYPE "OrderAuthStatus_new" USING ("authStatus"::text::"OrderAuthStatus_new");
ALTER TYPE "OrderAuthStatus" RENAME TO "OrderAuthStatus_old";
ALTER TYPE "OrderAuthStatus_new" RENAME TO "OrderAuthStatus";
DROP TYPE "public"."OrderAuthStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "authStatus",
DROP COLUMN "currentShipTo",
DROP COLUMN "status",
ADD COLUMN     "authResult" "OrderAuthResult" NOT NULL DEFAULT 'NOT_PROCESSED',
ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "authStatus" "OrderAuthStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "authenticationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currentShipTo" "CurrentShipTo" NOT NULL DEFAULT 'BUYER',
ADD COLUMN     "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "public"."OrderItemStatus";
