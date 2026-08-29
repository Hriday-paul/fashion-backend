-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "actualPrice" DOUBLE PRECISION NOT NULL,
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "sendByBuyer" BOOLEAN NOT NULL DEFAULT true,
    "actionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_items" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offers_sellerId_buyerId_idx" ON "offers"("sellerId", "buyerId");

-- CreateIndex
CREATE INDEX "offers_buyerId_sellerId_idx" ON "offers"("buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "offer_items_offerId_productId_idx" ON "offer_items"("offerId", "productId");

-- CreateIndex
CREATE INDEX "offer_items_productId_offerId_idx" ON "offer_items"("productId", "offerId");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_items" ADD CONSTRAINT "offer_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_items" ADD CONSTRAINT "offer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
