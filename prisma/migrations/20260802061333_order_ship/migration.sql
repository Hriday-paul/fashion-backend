/*
  Warnings:

  - The `status` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `orderId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED_TO_AUTHENTICATION_CENTRE', 'AUTHENTICATION_CENTRE_RECEIVED_ITEM', 'AUTHENTICATION_IN_PROGRESS', 'AUTHENTICATION_PASSED', 'AUTHENTICATION_FAILED', 'SHIPPED_TO_BUYER', 'DELIVERED_TO_BUYER', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShippingGroupStatus" AS ENUM ('PENDING', 'SHIPPED_TO_AUTHENTICATION_CENTRE', 'AUTHENTICATION_CENTRE_RECEIVED_ITEM', 'AUTHENTICATION_IN_PROGRESS', 'AUTHENTICATION_RESPONDED', 'SHIPPED_TO_BUYER', 'DELIVERED_TO_BUYER', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "shippingGroupId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- CreateTable
CREATE TABLE "order_shipping_groups" (
    "id" TEXT NOT NULL,
    "status" "ShippingGroupStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_shipping_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_shippingGroupId_fkey" FOREIGN KEY ("shippingGroupId") REFERENCES "order_shipping_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
