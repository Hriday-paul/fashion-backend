-- DropForeignKey
ALTER TABLE "product_views" DROP CONSTRAINT "product_views_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_views" DROP CONSTRAINT "product_views_userId_fkey";

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
