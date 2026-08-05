/*
  Warnings:

  - Added the required column `sellerId` to the `order_shipping_groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_shipping_groups" ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "order_shipping_groups" ADD CONSTRAINT "order_shipping_groups_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
