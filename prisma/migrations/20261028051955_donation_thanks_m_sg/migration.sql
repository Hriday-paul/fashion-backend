-- CreateTable
CREATE TABLE "DonationThanksMSg" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "sellDonationId" TEXT,
    "directDonationId" TEXT,
    "clothDonationId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationThanksMSg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationThanksMSg_sellDonationId_key" ON "DonationThanksMSg"("sellDonationId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationThanksMSg_directDonationId_key" ON "DonationThanksMSg"("directDonationId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationThanksMSg_clothDonationId_key" ON "DonationThanksMSg"("clothDonationId");

-- CreateIndex
CREATE INDEX "DonationThanksMSg_donorId_idx" ON "DonationThanksMSg"("donorId");

-- CreateIndex
CREATE INDEX "DonationThanksMSg_sellDonationId_idx" ON "DonationThanksMSg"("sellDonationId");

-- CreateIndex
CREATE INDEX "DonationThanksMSg_directDonationId_idx" ON "DonationThanksMSg"("directDonationId");

-- CreateIndex
CREATE INDEX "DonationThanksMSg_clothDonationId_idx" ON "DonationThanksMSg"("clothDonationId");

-- AddForeignKey
ALTER TABLE "DonationThanksMSg" ADD CONSTRAINT "DonationThanksMSg_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationThanksMSg" ADD CONSTRAINT "DonationThanksMSg_sellDonationId_fkey" FOREIGN KEY ("sellDonationId") REFERENCES "sellItemMoneyDonations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationThanksMSg" ADD CONSTRAINT "DonationThanksMSg_directDonationId_fkey" FOREIGN KEY ("directDonationId") REFERENCES "DirectDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationThanksMSg" ADD CONSTRAINT "DonationThanksMSg_clothDonationId_fkey" FOREIGN KEY ("clothDonationId") REFERENCES "ClothDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
