/*
  Warnings:

  - A unique constraint covering the columns `[orderItemId]` on the table `return_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "return_items_orderItemId_key" ON "return_items"("orderItemId");
