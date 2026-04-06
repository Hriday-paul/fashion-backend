/*
  Warnings:

  - You are about to drop the column `orderId` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `sellerGroupId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryChargeStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sellItemMoneyDonations" DROP CONSTRAINT "sellItemMoneyDonations_orderItemId_fkey";

-- DropIndex
DROP INDEX "public"."OrderItem_orderId_idx";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "orderId",
ADD COLUMN     "sellerGroupId" TEXT NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "itemsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDelivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "totalPrice" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "order_seller_groups" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_seller_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_seller_deliveries" (
    "id" TEXT NOT NULL,
    "sellerGroupId" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DeliveryChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_seller_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_seller_groups_orderId_idx" ON "order_seller_groups"("orderId");

-- CreateIndex
CREATE INDEX "order_seller_groups_sellerId_idx" ON "order_seller_groups"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "order_seller_groups_orderId_sellerId_key" ON "order_seller_groups"("orderId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "order_seller_deliveries_sellerGroupId_key" ON "order_seller_deliveries"("sellerGroupId");

-- CreateIndex
CREATE INDEX "OrderItem_sellerGroupId_idx" ON "OrderItem"("sellerGroupId");

-- AddForeignKey
ALTER TABLE "order_seller_groups" ADD CONSTRAINT "order_seller_groups_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_seller_groups" ADD CONSTRAINT "order_seller_groups_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_seller_deliveries" ADD CONSTRAINT "order_seller_deliveries_sellerGroupId_fkey" FOREIGN KEY ("sellerGroupId") REFERENCES "order_seller_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sellerGroupId_fkey" FOREIGN KEY ("sellerGroupId") REFERENCES "order_seller_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellItemMoneyDonations" ADD CONSTRAINT "sellItemMoneyDonations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
