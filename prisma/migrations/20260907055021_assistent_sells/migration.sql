/*
  Warnings:

  - A unique constraint covering the columns `[assistentSellId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssistentSellStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LISTED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('TARGET_AMOUNT', 'DISCUSSION', 'MARKET_PRICE');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "assistentSellId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "assistentSellId" TEXT;

-- CreateTable
CREATE TABLE "assistent_sells" (
    "id" TEXT NOT NULL,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "contactNumber" TEXT,
    "itemsDetails" TEXT,
    "priceType" "PriceType" NOT NULL DEFAULT 'MARKET_PRICE',
    "targetPrice" DOUBLE PRECISION DEFAULT 0,
    "additionalNotes" TEXT,
    "donationPct" DOUBLE PRECISION DEFAULT 0,
    "deliveryCharge" DOUBLE PRECISION DEFAULT 0,
    "status" "AssistentSellStatus" NOT NULL DEFAULT 'PENDING',
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "hight_cm" DOUBLE PRECISION NOT NULL,
    "width_cm" DOUBLE PRECISION NOT NULL,
    "length_cm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "assistent_sells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistent_sell_bundle_pictures" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "assistentSellId" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistent_sell_bundle_pictures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistentSellCharities" (
    "id" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "assistentSellId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistentSellCharities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistent_sells_status_priceType_idx" ON "assistent_sells"("status", "priceType");

-- CreateIndex
CREATE INDEX "assistent_sells_priceType_status_idx" ON "assistent_sells"("priceType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assistentSellCharities_assistentSellId_charityId_key" ON "assistentSellCharities"("assistentSellId", "charityId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_assistentSellId_key" ON "orders"("assistentSellId");

-- AddForeignKey
ALTER TABLE "assistent_sell_bundle_pictures" ADD CONSTRAINT "assistent_sell_bundle_pictures_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistentSellCharities" ADD CONSTRAINT "assistentSellCharities_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistentSellCharities" ADD CONSTRAINT "assistentSellCharities_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE CASCADE ON UPDATE CASCADE;
