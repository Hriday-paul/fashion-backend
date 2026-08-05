/*
  Warnings:

  - You are about to drop the column `cancelReason` on the `order_seller_groups` table. All the data in the column will be lost.
  - You are about to drop the column `cancelReasonDetails` on the `order_seller_groups` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledBy` on the `order_seller_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "cancelReason" "CancelReason",
ADD COLUMN     "cancelReasonDetails" TEXT,
ADD COLUMN     "cancelledBy" "CancelledBy";

-- AlterTable
ALTER TABLE "order_seller_groups" DROP COLUMN "cancelReason",
DROP COLUMN "cancelReasonDetails",
DROP COLUMN "cancelledBy";
