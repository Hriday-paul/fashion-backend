-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "size_category_group" DROP CONSTRAINT "size_category_group_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "size_category_group" DROP CONSTRAINT "size_category_group_letterSizeGroupId_fkey";

-- DropForeignKey
ALTER TABLE "size_category_group" DROP CONSTRAINT "size_category_group_sizeGroupId_fkey";

-- DropIndex
DROP INDEX "size_category_group_categoryId_letterSizeGroupId_key";

-- DropIndex
DROP INDEX "size_category_group_categoryId_sizeGroupId_key";

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_sizeGroupId_fkey" FOREIGN KEY ("sizeGroupId") REFERENCES "sizeGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_letterSizeGroupId_fkey" FOREIGN KEY ("letterSizeGroupId") REFERENCES "letterSizeGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
