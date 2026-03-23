/*
  Warnings:

  - You are about to drop the column `amount` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "amount",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "seller_received_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "seller_required_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
