-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "authCourierServiceId" TEXT,
ADD COLUMN     "authLebelUrl" TEXT,
ADD COLUMN     "authParcelId" TEXT,
ADD COLUMN     "authShippingId" TEXT,
ADD COLUMN     "isAuthLebelGenerated" BOOLEAN NOT NULL DEFAULT false;
