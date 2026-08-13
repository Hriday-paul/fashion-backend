/*
  Warnings:

  - A unique constraint covering the columns `[sellerId]` on the table `billing_details` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "billing_details" ADD COLUMN     "sellerId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "originDetailsId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "billing_details_sellerId_key" ON "billing_details"("sellerId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_originDetailsId_fkey" FOREIGN KEY ("originDetailsId") REFERENCES "billing_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_details" ADD CONSTRAINT "billing_details_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
