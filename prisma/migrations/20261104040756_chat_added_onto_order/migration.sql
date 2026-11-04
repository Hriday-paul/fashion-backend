/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "chatId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_chatId_key" ON "orders"("chatId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chatGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
