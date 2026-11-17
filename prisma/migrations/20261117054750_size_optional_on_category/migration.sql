/*
  Warnings:

  - A unique constraint covering the columns `[categoryId]` on the table `size_category_group` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "size_category_group" DROP CONSTRAINT "size_category_group_categoryId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "size_category_group_categoryId_key" ON "size_category_group"("categoryId");

-- AddForeignKey
ALTER TABLE "size_category_group" ADD CONSTRAINT "size_category_group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
