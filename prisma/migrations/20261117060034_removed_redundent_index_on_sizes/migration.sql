-- DropIndex
DROP INDEX "size_category_group_categoryId_sizeGroupId_idx";

-- DropIndex
DROP INDEX "size_category_group_sizeGroupId_categoryId_idx";

-- CreateIndex
CREATE INDEX "size_category_group_sizeGroupId_idx" ON "size_category_group"("sizeGroupId");
