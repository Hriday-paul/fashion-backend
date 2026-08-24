/*
  Warnings:

  - You are about to drop the column `catagory_child_hierarchy` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `catagory_child_hierarchy` on the `sizes` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `sizes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."brands" DROP CONSTRAINT "brands_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sizes" DROP CONSTRAINT "sizes_categoryId_fkey";

-- AlterTable
ALTER TABLE "brands" DROP COLUMN "catagory_child_hierarchy",
DROP COLUMN "categoryId";

-- AlterTable
ALTER TABLE "sizes" DROP COLUMN "catagory_child_hierarchy",
DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "brand_by_category" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_by_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size_by_category" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_by_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_by_category_categoryId_brandId_idx" ON "brand_by_category"("categoryId", "brandId");

-- CreateIndex
CREATE INDEX "brand_by_category_brandId_categoryId_idx" ON "brand_by_category"("brandId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_by_category_categoryId_brandId_key" ON "brand_by_category"("categoryId", "brandId");

-- CreateIndex
CREATE INDEX "size_by_category_categoryId_sizeId_idx" ON "size_by_category"("categoryId", "sizeId");

-- CreateIndex
CREATE INDEX "size_by_category_sizeId_categoryId_idx" ON "size_by_category"("sizeId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "size_by_category_categoryId_sizeId_key" ON "size_by_category"("categoryId", "sizeId");

-- AddForeignKey
ALTER TABLE "brand_by_category" ADD CONSTRAINT "brand_by_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_by_category" ADD CONSTRAINT "brand_by_category_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_by_category" ADD CONSTRAINT "size_by_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_by_category" ADD CONSTRAINT "size_by_category_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
