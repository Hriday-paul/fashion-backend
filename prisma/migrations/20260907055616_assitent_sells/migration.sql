/*
  Warnings:

  - Added the required column `sellerId` to the `assistent_sells` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assistent_sells" ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "assistent_sells" ADD CONSTRAINT "assistent_sells_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
