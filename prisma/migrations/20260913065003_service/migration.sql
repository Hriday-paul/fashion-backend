/*
  Warnings:

  - You are about to drop the column `authenticationCost` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFeeCost` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `shippingServiceId` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `treeGiftCost` on the `carts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "carts" DROP COLUMN "authenticationCost",
DROP COLUMN "serviceFeeCost",
DROP COLUMN "shippingServiceId",
DROP COLUMN "treeGiftCost";
