/*
  Warnings:

  - A unique constraint covering the columns `[extraDonationId]` on the table `DonationThanksMSg` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ThanksMessageType" ADD VALUE 'EXTRA';

-- AlterTable
ALTER TABLE "DonationThanksMSg" ADD COLUMN     "extraDonationId" TEXT;

-- CreateTable
CREATE TABLE "extraItemMoneyDonations" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "orderItemId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "donatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extraItemMoneyDonations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extraItemMoneyDonations_orderId_idx" ON "extraItemMoneyDonations"("orderId");

-- CreateIndex
CREATE INDEX "extraItemMoneyDonations_charityId_idx" ON "extraItemMoneyDonations"("charityId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationThanksMSg_extraDonationId_key" ON "DonationThanksMSg"("extraDonationId");

-- AddForeignKey
ALTER TABLE "DonationThanksMSg" ADD CONSTRAINT "DonationThanksMSg_extraDonationId_fkey" FOREIGN KEY ("extraDonationId") REFERENCES "extraItemMoneyDonations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraItemMoneyDonations" ADD CONSTRAINT "extraItemMoneyDonations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraItemMoneyDonations" ADD CONSTRAINT "extraItemMoneyDonations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraItemMoneyDonations" ADD CONSTRAINT "extraItemMoneyDonations_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
