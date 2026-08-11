/*
  Warnings:

  - A unique constraint covering the columns `[cartGroupId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_orderId_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cartGroupId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_cartGroupId_key" ON "payments"("cartGroupId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_cartGroupId_fkey" FOREIGN KEY ("cartGroupId") REFERENCES "carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
