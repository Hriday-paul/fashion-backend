-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "brandId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "catagory_hierarchy" TEXT[],
    "condition" TEXT NOT NULL,
    "tags" TEXT[],
    "meterials" TEXT[],
    "color" TEXT NOT NULL,
    "care_instructions" TEXT[],
    "allow_offer" BOOLEAN NOT NULL DEFAULT false,
    "return_window" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_pictures" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_pictures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productCharities" (
    "id" TEXT NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productCharities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellItemMoneyDonations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,

    CONSTRAINT "sellItemMoneyDonations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productCharities_productId_charityId_key" ON "productCharities"("productId", "charityId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_pictures" ADD CONSTRAINT "product_pictures_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productCharities" ADD CONSTRAINT "productCharities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productCharities" ADD CONSTRAINT "productCharities_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellItemMoneyDonations" ADD CONSTRAINT "sellItemMoneyDonations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellItemMoneyDonations" ADD CONSTRAINT "sellItemMoneyDonations_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
