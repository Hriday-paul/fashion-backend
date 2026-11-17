/*
  Warnings:

  - You are about to drop the column `parentId` on the `sizes` table. All the data in the column will be lost.
  - You are about to drop the `size_category_hierarchy_group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "size_category_hierarchy_group" DROP CONSTRAINT "size_category_hierarchy_group_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "size_category_hierarchy_group" DROP CONSTRAINT "size_category_hierarchy_group_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "sizes" DROP CONSTRAINT "sizes_parentId_fkey";

-- AlterTable
ALTER TABLE "sizes" DROP COLUMN "parentId",
ADD COLUMN     "FR" TEXT,
ADD COLUMN     "IT" TEXT,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "letterGroupId" TEXT;

-- DropTable
DROP TABLE "size_category_hierarchy_group";

-- CreateTable
CREATE TABLE "size_category_group" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sizeGroupId" TEXT,
    "letterSizeGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_category_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sizeGroups" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sizeGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letterSizeGroups" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letterSizeGroups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "size_category_group_categoryId_sizeGroupId_idx" ON "size_category_group"("categoryId", "sizeGroupId");

-- CreateIndex
CREATE INDEX "size_category_group_sizeGroupId_categoryId_idx" ON "size_category_group"("sizeGroupId", "categoryId");

-- CreateIndex
CREATE INDEX "size_category_group_letterSizeGroupId_idx" ON "size_category_group"("letterSizeGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "size_category_group_categoryId_sizeGroupId_key" ON "size_category_group"("categoryId", "sizeGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "size_category_group_categoryId_letterSizeGroupId_key" ON "size_category_group"("categoryId", "letterSizeGroupId");

-- CreateIndex
CREATE INDEX "sizes_groupId_idx" ON "sizes"("groupId");

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_sizeGroupId_fkey" FOREIGN KEY ("sizeGroupId") REFERENCES "sizeGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_letterSizeGroupId_fkey" FOREIGN KEY ("letterSizeGroupId") REFERENCES "letterSizeGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "sizeGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_letterGroupId_fkey" FOREIGN KEY ("letterGroupId") REFERENCES "letterSizeGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
