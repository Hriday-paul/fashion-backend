-- CreateTable
CREATE TABLE "cart_donation_charities" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_donation_charities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_donation_charities_cartItemId_charityId_key" ON "cart_donation_charities"("cartItemId", "charityId");

-- AddForeignKey
ALTER TABLE "cart_donation_charities" ADD CONSTRAINT "cart_donation_charities_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_donation_charities" ADD CONSTRAINT "cart_donation_charities_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
