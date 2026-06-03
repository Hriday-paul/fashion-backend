-- CreateTable
CREATE TABLE "BundleDiscount" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleDiscountTier" (
    "id" TEXT NOT NULL,
    "bundleDiscountId" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleDiscountTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BundleDiscount_sellerId_key" ON "BundleDiscount"("sellerId");

-- CreateIndex
CREATE INDEX "BundleDiscountTier_bundleDiscountId_idx" ON "BundleDiscountTier"("bundleDiscountId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleDiscountTier_bundleDiscountId_itemCount_key" ON "BundleDiscountTier"("bundleDiscountId", "itemCount");

-- AddForeignKey
ALTER TABLE "BundleDiscount" ADD CONSTRAINT "BundleDiscount_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleDiscountTier" ADD CONSTRAINT "BundleDiscountTier_bundleDiscountId_fkey" FOREIGN KEY ("bundleDiscountId") REFERENCES "BundleDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
