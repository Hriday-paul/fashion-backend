-- DropForeignKey
ALTER TABLE "productCharities" DROP CONSTRAINT "productCharities_charityId_fkey";

-- DropForeignKey
ALTER TABLE "productCharities" DROP CONSTRAINT "productCharities_productId_fkey";

-- AddForeignKey
ALTER TABLE "productCharities" ADD CONSTRAINT "productCharities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productCharities" ADD CONSTRAINT "productCharities_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
