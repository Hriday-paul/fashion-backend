/*
  Warnings:

  - You are about to drop the column `isBuyerRequestCancel` on the `OrderItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BuyerRequestCancelStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "isBuyerRequestCancel",
ADD COLUMN     "buyerRequestCancel" "BuyerRequestCancelStatus" NOT NULL DEFAULT 'NOT_REQUESTED';
