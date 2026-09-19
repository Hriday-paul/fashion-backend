/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `returns` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "returns_orderId_key" ON "returns"("orderId");
