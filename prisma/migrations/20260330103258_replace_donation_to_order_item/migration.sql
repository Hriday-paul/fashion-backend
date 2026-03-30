/*
  Warnings:

  - You are about to drop the column `percent` on the `productCharities` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `sellItemMoneyDonations` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `sellItemMoneyDonations` table. All the data in the column will be lost.
  - Added the required column `orderItemId` to the `sellItemMoneyDonations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."sellItemMoneyDonations" DROP CONSTRAINT "sellItemMoneyDonations_productId_fkey";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "donation_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "donation_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "extra_donation" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "productCharities" DROP COLUMN "percent";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "donation_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sellItemMoneyDonations" DROP COLUMN "orderId",
DROP COLUMN "productId",
ADD COLUMN     "extra_money" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "orderItemId" TEXT NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "percent" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "sellItemMoneyDonations" ADD CONSTRAINT "sellItemMoneyDonations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
