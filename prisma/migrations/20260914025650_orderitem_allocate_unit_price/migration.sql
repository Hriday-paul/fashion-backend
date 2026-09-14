-- CreateEnum
CREATE TYPE "OrderPricingSource" AS ENUM ('OFFER', 'BUNDLE');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sellerFinalUnitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitAllocatedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "pricingSource" "OrderPricingSource" NOT NULL DEFAULT 'BUNDLE';

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
