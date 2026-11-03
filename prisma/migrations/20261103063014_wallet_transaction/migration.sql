/*
  Warnings:

  - You are about to drop the column `creditType` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `idempotencyKey` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `pendingAfter` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `pendingBefore` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `stripePayoutId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `balanceBefore` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `balanceAfter` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `balance` on the `wallets` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to drop the `wallet_payouts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `direction` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `txType` on the `wallet_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('EARNING', 'DONATION_RECEIVED', 'PURCHASE', 'DONATION_SENT', 'REFUND', 'WITHDRAWAL', 'SHIPPING', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('IN', 'OUT');

-- DropForeignKey
ALTER TABLE "public"."wallet_payouts" DROP CONSTRAINT "wallet_payouts_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."wallet_payouts" DROP CONSTRAINT "wallet_payouts_walletId_fkey";

-- DropIndex
DROP INDEX "public"."wallet_transactions_idempotencyKey_key";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "allow_offer" SET DEFAULT true,
ALTER COLUMN "return_window" SET DEFAULT 7;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "creditType",
DROP COLUMN "idempotencyKey",
DROP COLUMN "orderId",
DROP COLUMN "pendingAfter",
DROP COLUMN "pendingBefore",
DROP COLUMN "stripePayoutId",
ADD COLUMN     "direction" "TransactionDirection" NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refId" TEXT,
ADD COLUMN     "stripeBalanceTransactionId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "txType",
ADD COLUMN     "txType" "WalletTransactionType" NOT NULL,
ALTER COLUMN "amount" DROP DEFAULT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balanceBefore" DROP DEFAULT,
ALTER COLUMN "balanceBefore" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balanceAfter" DROP DEFAULT,
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2);

-- DropTable
DROP TABLE "public"."wallet_payouts";

-- DropEnum
DROP TYPE "public"."CreaditType";

-- DropEnum
DROP TYPE "public"."PayoutStatus";

-- DropEnum
DROP TYPE "public"."TxType";

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
