/*
  Warnings:

  - The values [Text,Payment,Cancelled] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `senderId` on the `Notification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('PRODUCT', 'OFFER', 'ORDER', 'MESSAGE', 'USER', 'DONATION', 'RETURN');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('PRODUCT_LIKE', 'PRICE_DROP', 'SOLD_OUT', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_CANCELED', 'ORDER_PLACED', 'ORDER_STATUS_CHANGED', 'ORDER_COMPLETED', 'ORDER_ITEM_CANCELED', 'MESSAGE_RECEIVED', 'FOLLOWED', 'REVIEW_RECEIVED', 'DONATION_RECEIVED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_COMPLETED', 'RETURN_STATUS_CHANGED', 'RETURN_ITEM_CANCELED');
ALTER TABLE "public"."Notification" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "senderId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityImgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "entityType" "NotificationEntityType",
ADD COLUMN     "groupKeyId" TEXT,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
