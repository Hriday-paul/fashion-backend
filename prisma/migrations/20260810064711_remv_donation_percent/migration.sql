/*
  Warnings:

  - You are about to drop the column `donation_amount` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `donation_percent` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "donation_amount",
DROP COLUMN "donation_percent";
