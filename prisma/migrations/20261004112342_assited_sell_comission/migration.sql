-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "assistedSellCommission" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "assistedSellCommission" DOUBLE PRECISION NOT NULL DEFAULT 0;
