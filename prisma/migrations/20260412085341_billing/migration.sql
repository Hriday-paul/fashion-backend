/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `billing_details` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `state` to the `billing_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "billing_details" ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "state" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "billing_details_orderId_key" ON "billing_details"("orderId");

-- AddForeignKey
ALTER TABLE "billing_details" ADD CONSTRAINT "billing_details_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
