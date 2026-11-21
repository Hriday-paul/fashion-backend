/*
  Warnings:

  - You are about to drop the column `orderId` on the `extraItemMoneyDonations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."extraItemMoneyDonations" DROP CONSTRAINT "extraItemMoneyDonations_orderId_fkey";

-- DropIndex
DROP INDEX "public"."extraItemMoneyDonations_orderId_idx";

-- AlterTable
ALTER TABLE "extraItemMoneyDonations" DROP COLUMN "orderId";
