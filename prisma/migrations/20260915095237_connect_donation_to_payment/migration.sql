/*
  Warnings:

  - You are about to drop the column `paymentIntentId` on the `DirectDonation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DirectDonation` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `DirectDonation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[donationId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ORDER', 'DONATION', 'SUBSCRIPTION');

-- DropIndex
DROP INDEX "public"."DirectDonation_paymentIntentId_key";

-- DropIndex
DROP INDEX "public"."DirectDonation_status_idx";

-- DropIndex
DROP INDEX "public"."DirectDonation_transactionId_key";

-- AlterTable
ALTER TABLE "DirectDonation" DROP COLUMN "paymentIntentId",
DROP COLUMN "status",
DROP COLUMN "transactionId";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "donationId" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'ORDER',
ALTER COLUMN "orderId" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."DirectDonationStatus";

-- CreateIndex
CREATE UNIQUE INDEX "payments_donationId_key" ON "payments"("donationId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "DirectDonation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
