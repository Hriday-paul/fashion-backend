/*
  Warnings:

  - Added the required column `sellerAddressId` to the `assistent_sells` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assistent_sells" ADD COLUMN     "sellerAddressId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "assistent_sells" ADD CONSTRAINT "assistent_sells_sellerAddressId_fkey" FOREIGN KEY ("sellerAddressId") REFERENCES "billing_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
