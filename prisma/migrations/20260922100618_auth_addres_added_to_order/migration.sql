-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "authDetailsId" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_authDetailsId_fkey" FOREIGN KEY ("authDetailsId") REFERENCES "billing_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
