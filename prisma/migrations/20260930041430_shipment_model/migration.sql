/*
  Warnings:

  - The values [SHIPPED,OUT_FOR_DELIVERY,DELIVERED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SHIPPED,OUT_FOR_DELIVERY,DELIVERED] on the enum `ReturnStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assistentSellId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `authCourierServiceId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `authLebelUrl` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `authParcelId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `authShippingId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `courier_service_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `isAuthLebelGenerated` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `isLebelGenerated` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `lebelUrl` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `parcelId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shippingId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `courier_service_id` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `isLebelGenerated` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `lebelUrl` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `parcelId` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `shippingId` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `trackingCarrier` on the `returns` table. All the data in the column will be lost.
  - You are about to drop the column `trackingNumber` on the `returns` table. All the data in the column will be lost.
  - Added the required column `shipmentId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'SHIPPING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReturnStatus_new" AS ENUM ('REQUESTED', 'APPROVED', 'DECLINED', 'SHIPPING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."returns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "returns" ALTER COLUMN "status" TYPE "ReturnStatus_new" USING ("status"::text::"ReturnStatus_new");
ALTER TYPE "ReturnStatus" RENAME TO "ReturnStatus_old";
ALTER TYPE "ReturnStatus_new" RENAME TO "ReturnStatus";
DROP TYPE "public"."ReturnStatus_old";
ALTER TABLE "returns" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_assistentSellId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_assistentSellId_fkey";

-- DropIndex
DROP INDEX "public"."orders_assistentSellId_key";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "assistentSellId",
DROP COLUMN "authCourierServiceId",
DROP COLUMN "authLebelUrl",
DROP COLUMN "authParcelId",
DROP COLUMN "authShippingId",
DROP COLUMN "courier_service_id",
DROP COLUMN "isAuthLebelGenerated",
DROP COLUMN "isLebelGenerated",
DROP COLUMN "lebelUrl",
DROP COLUMN "parcelId",
DROP COLUMN "shippedAt",
DROP COLUMN "shippingId",
ADD COLUMN     "authShipmentId" TEXT,
ADD COLUMN     "shipmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "returns" DROP COLUMN "courier_service_id",
DROP COLUMN "isLebelGenerated",
DROP COLUMN "lebelUrl",
DROP COLUMN "parcelId",
DROP COLUMN "refundAmount",
DROP COLUMN "refundedAt",
DROP COLUMN "shippingId",
DROP COLUMN "trackingCarrier",
DROP COLUMN "trackingNumber";

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "assitentSellId" TEXT,
    "returnId" TEXT,
    "courier_service_id" TEXT NOT NULL,
    "shippingId" TEXT NOT NULL,
    "isLebelGenerated" BOOLEAN NOT NULL DEFAULT false,
    "lebelUrl" TEXT,
    "parcelId" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "shipmentStatus" "ShipmentStatus" NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDescription" TEXT,
    "eventLocation" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ship_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_assitentSellId_key" ON "shipments"("assitentSellId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_returnId_key" ON "shipments"("returnId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_authShipmentId_fkey" FOREIGN KEY ("authShipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_assitentSellId_fkey" FOREIGN KEY ("assitentSellId") REFERENCES "assistent_sells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ship_events" ADD CONSTRAINT "ship_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
