-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3);
