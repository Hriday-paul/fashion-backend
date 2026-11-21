/*
  Warnings:

  - You are about to drop the column `currency` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `DirectDonation` table. All the data in the column will be lost.

  All amounts are stored in GBP, so a per-row currency is not needed.
*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "currency";

-- AlterTable
ALTER TABLE "DirectDonation" DROP COLUMN "currency";
