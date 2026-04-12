/*
  Warnings:

  - You are about to drop the column `orderId` on the `billing_details` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."billing_details" DROP CONSTRAINT "billing_details_orderId_fkey";

-- DropIndex
DROP INDEX "public"."billing_details_orderId_key";

-- AlterTable
ALTER TABLE "billing_details" DROP COLUMN "orderId";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "billingId" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "billing_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
