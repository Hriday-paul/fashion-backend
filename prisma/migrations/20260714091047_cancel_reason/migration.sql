/*
  Warnings:

  - You are about to drop the column `buyerCancelReason` on the `order_seller_groups` table. All the data in the column will be lost.
  - You are about to drop the column `sellerCancelReason` on the `order_seller_groups` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CancelReason" AS ENUM ('CHANGED_MIND', 'FOUND_BETTER_PRICE', 'ORDERED_BY_MISTAKE', 'ITEM_NO_LONGER_NEEDED', 'DELIVERY_TOO_LONG', 'FOUND_BETTER_PRODUCT', 'WRONG_ITEM_SELECTED', 'DUPLICATE_ORDER', 'SHIPPING_COST_TOO_HIGH', 'PAYMENT_ISSUE', 'SELLER_UNRESPONSIVE', 'OUT_OF_STOCK', 'UNABLE_TO_FULFILL_IN_TIME', 'PRICING_ERROR', 'BUYER_UNREACHABLE', 'SUSPECTED_FRAUD', 'SHIPPING_ADDRESS_ISSUE', 'LISTING_ERROR', 'BUYER_REQUESTED', 'DAMAGED_INVENTORY', 'PAYMENT_NOT_VERIFIED', 'OTHER');

-- AlterTable
ALTER TABLE "order_seller_groups" DROP COLUMN "buyerCancelReason",
DROP COLUMN "sellerCancelReason",
ADD COLUMN     "cancelReason" "CancelReason";

-- DropEnum
DROP TYPE "public"."BuyerCancelReason";

-- DropEnum
DROP TYPE "public"."SellerCancelReason";
