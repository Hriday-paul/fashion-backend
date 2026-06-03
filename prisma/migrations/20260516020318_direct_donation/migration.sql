-- CreateEnum
CREATE TYPE "DirectDonationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "DirectDonation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT,
    "charityId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "DirectDonationStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paymentIntentId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "donatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectDonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectDonation_transactionId_key" ON "DirectDonation"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectDonation_paymentIntentId_key" ON "DirectDonation"("paymentIntentId");

-- CreateIndex
CREATE INDEX "DirectDonation_charityId_idx" ON "DirectDonation"("charityId");

-- CreateIndex
CREATE INDEX "DirectDonation_donorId_idx" ON "DirectDonation"("donorId");

-- CreateIndex
CREATE INDEX "DirectDonation_status_idx" ON "DirectDonation"("status");

-- AddForeignKey
ALTER TABLE "DirectDonation" ADD CONSTRAINT "DirectDonation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectDonation" ADD CONSTRAINT "DirectDonation_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
