/*
  Warnings:

  - You are about to drop the `size_by_category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."size_by_category" DROP CONSTRAINT "size_by_category_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."size_by_category" DROP CONSTRAINT "size_by_category_sizeId_fkey";

-- AlterTable
ALTER TABLE "sizes" ADD COLUMN     "EU" TEXT,
ADD COLUMN     "UK" TEXT,
ADD COLUMN     "US" TEXT,
ADD COLUMN     "parentId" TEXT;

-- DropTable
DROP TABLE "public"."size_by_category";

-- CreateTable
CREATE TABLE "size_category_hierarchy_group" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_category_hierarchy_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "size_category_hierarchy_group_categoryId_sizeId_idx" ON "size_category_hierarchy_group"("categoryId", "sizeId");

-- CreateIndex
CREATE INDEX "size_category_hierarchy_group_sizeId_categoryId_idx" ON "size_category_hierarchy_group"("sizeId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "size_category_hierarchy_group_categoryId_sizeId_key" ON "size_category_hierarchy_group"("categoryId", "sizeId");

-- AddForeignKey
ALTER TABLE "size_category_hierarchy_group" ADD CONSTRAINT "size_category_hierarchy_group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_category_hierarchy_group" ADD CONSTRAINT "size_category_hierarchy_group_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
