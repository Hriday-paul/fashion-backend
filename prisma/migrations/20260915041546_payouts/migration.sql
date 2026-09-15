-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "wallet_payouts" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripePayoutId" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "connectAccountId" TEXT NOT NULL,
    "stripeBalanceTransactionId" TEXT,
    "payoutData" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_payouts_walletId_idx" ON "wallet_payouts"("walletId");

-- CreateIndex
CREATE INDEX "wallet_payouts_userId_idx" ON "wallet_payouts"("userId");

-- AddForeignKey
ALTER TABLE "wallet_payouts" ADD CONSTRAINT "wallet_payouts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_payouts" ADD CONSTRAINT "wallet_payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
