/*
  Warnings:

  - You are about to drop the `order_delivery_charges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."order_delivery_charges" DROP CONSTRAINT "order_delivery_charges_orderId_fkey";

-- DropTable
DROP TABLE "public"."order_delivery_charges";

-- DropEnum
DROP TYPE "public"."DeliveryChargeStatus";
