/*
  Warnings:

  - You are about to drop the column `currency` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `pendingBalance` on the `wallets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "currency",
DROP COLUMN "pendingBalance";

-- CreateIndex
CREATE INDEX "wallets_sellerId_idx" ON "wallets"("sellerId");
