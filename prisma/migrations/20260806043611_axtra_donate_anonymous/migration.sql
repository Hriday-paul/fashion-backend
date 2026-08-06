/*
  Warnings:

  - You are about to drop the column `isAnonymous` on the `cart_donation_charities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cart_donation_charities" DROP COLUMN "isAnonymous";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "extraDonationAnonymous" BOOLEAN NOT NULL DEFAULT false;
