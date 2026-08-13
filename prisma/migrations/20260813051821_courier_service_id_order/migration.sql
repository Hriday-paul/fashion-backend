-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courier_service_id" TEXT NOT NULL DEFAULT '42a0679a-d06b-4443-93dc-1b1254e8e29a',
ADD COLUMN     "shippingId" TEXT;
