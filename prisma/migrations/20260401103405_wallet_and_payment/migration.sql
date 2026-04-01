/*
  Warnings:

  - You are about to drop the column `isPaid` on the `payments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StripePaymentStatus" AS ENUM ('PENDING', 'ESCROWED', 'DELIVERED', 'RELEASED', 'REFUNDED', 'FAILED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CreaditType" AS ENUM ('PENDING', 'RELEASED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('DEBIT', 'CREDIT');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- DropIndex
DROP INDEX "public"."payments_transactionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "isPaid",
ADD COLUMN     "checkoutSessionId" TEXT,
ADD COLUMN     "escrowedAt" TIMESTAMP(3),
ADD COLUMN     "reconciledAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "releasedAt" TIMESTAMP(3),
ADD COLUMN     "sellerConnectAccountId" TEXT,
ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "stripeTransferId" TEXT,
ADD COLUMN     "stripe_status" "StripePaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transferGroup" TEXT;

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeConnectAccountId" TEXT,
    "lastPayoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "creditType" "CreaditType" NOT NULL DEFAULT 'PENDING',
    "txType" "TxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "orderId" TEXT,
    "stripePayoutId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_sellerId_key" ON "wallets"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
