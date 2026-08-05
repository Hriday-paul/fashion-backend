/*
  Warnings:

  - The values [CONFIRMED,SHIPPED_TO_AUTHENTICATION_CENTRE,AUTHENTICATION_CENTRE_RECEIVED_ITEM,AUTHENTICATION_IN_PROGRESS,AUTHENTICATION_PASSED,AUTHENTICATION_FAILED,SHIPPED_TO_BUYER,DELIVERED_TO_BUYER] on the enum `OrderItemStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sellerGroupId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `shippingGroupId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_seller_deliveries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_seller_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_shipping_groups` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orderId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CurrentShipTo" AS ENUM ('AUTHENTICATION_CENTER', 'BUYER');

-- CreateEnum
CREATE TYPE "OrderAuthStatus" AS ENUM ('NOT_STARTED', 'ITEM_RECEIVED', 'IN_PROGRESS', 'PASSED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderItemStatus_new" AS ENUM ('PENDING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."OrderItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "status" TYPE "OrderItemStatus_new" USING ("status"::text::"OrderItemStatus_new");
ALTER TYPE "OrderItemStatus" RENAME TO "OrderItemStatus_old";
ALTER TYPE "OrderItemStatus_new" RENAME TO "OrderItemStatus";
DROP TYPE "public"."OrderItemStatus_old";
ALTER TABLE "OrderItem" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_sellerGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_shippingGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_seller_deliveries" DROP CONSTRAINT "order_seller_deliveries_sellerGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_seller_groups" DROP CONSTRAINT "order_seller_groups_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_seller_groups" DROP CONSTRAINT "order_seller_groups_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_shipping_groups" DROP CONSTRAINT "order_shipping_groups_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropIndex
DROP INDEX "public"."OrderItem_sellerGroupId_idx";

-- DropIndex
DROP INDEX "public"."orders_userId_idx";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "sellerGroupId",
DROP COLUMN "shippingGroupId",
ADD COLUMN     "authStatus" "OrderAuthStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "currentShipTo" "CurrentShipTo" NOT NULL DEFAULT 'BUYER',
ADD COLUMN     "isBuyerRequestCancel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "userId",
ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."order_seller_deliveries";

-- DropTable
DROP TABLE "public"."order_seller_groups";

-- DropTable
DROP TABLE "public"."order_shipping_groups";

-- DropEnum
DROP TYPE "public"."ShippingGroupStatus";

-- CreateTable
CREATE TABLE "order_delivery_charges" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DeliveryChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_delivery_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancel_order_evidence" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL DEFAULT 'IMAGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancel_order_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_delivery_charges_orderId_key" ON "order_delivery_charges"("orderId");

-- CreateIndex
CREATE INDEX "cancel_order_evidence_itemId_idx" ON "cancel_order_evidence"("itemId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "orders_buyerId_sellerId_idx" ON "orders"("buyerId", "sellerId");

-- AddForeignKey
ALTER TABLE "order_delivery_charges" ADD CONSTRAINT "order_delivery_charges_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancel_order_evidence" ADD CONSTRAINT "cancel_order_evidence_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
