/*
  Warnings:

  - A unique constraint covering the columns `[clothDonationId]` on the table `shipments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WashedType" AS ENUM ('RECENT_WASHED', 'WASHED', 'UNWASHED');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "ClothDonationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "clothDonationId" TEXT;

-- CreateTable
CREATE TABLE "ClothDonation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "donationType" "DonationType" NOT NULL,
    "itemTypes" TEXT[],
    "personTypes" TEXT[],
    "brands" TEXT[],
    "condition" TEXT NOT NULL,
    "washedType" "WashedType" NOT NULL,
    "description" TEXT,
    "status" "ClothDonationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ClothDonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClothDonationPhoto" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClothDonationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClothDonation_donorId_idx" ON "ClothDonation"("donorId");

-- CreateIndex
CREATE INDEX "ClothDonation_charityId_idx" ON "ClothDonation"("charityId");

-- CreateIndex
CREATE INDEX "ClothDonationPhoto_donationId_idx" ON "ClothDonationPhoto"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_clothDonationId_key" ON "shipments"("clothDonationId");

-- AddForeignKey
ALTER TABLE "ClothDonation" ADD CONSTRAINT "ClothDonation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClothDonation" ADD CONSTRAINT "ClothDonation_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClothDonationPhoto" ADD CONSTRAINT "ClothDonationPhoto_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "ClothDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_clothDonationId_fkey" FOREIGN KEY ("clothDonationId") REFERENCES "ClothDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
