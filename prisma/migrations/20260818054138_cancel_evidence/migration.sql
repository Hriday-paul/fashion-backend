/*
  Warnings:

  - You are about to drop the column `groupId` on the `cancel_order_evidence` table. All the data in the column will be lost.
  - You are about to drop the `cancel_evidence_group` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `itemId` to the `cancel_order_evidence` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cancel_evidence_group" DROP CONSTRAINT "cancel_evidence_group_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cancel_order_evidence" DROP CONSTRAINT "cancel_order_evidence_groupId_fkey";

-- DropIndex
DROP INDEX "public"."cancel_order_evidence_groupId_idx";

-- AlterTable
ALTER TABLE "cancel_order_evidence" DROP COLUMN "groupId",
ADD COLUMN     "itemId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."cancel_evidence_group";

-- CreateIndex
CREATE INDEX "cancel_order_evidence_itemId_idx" ON "cancel_order_evidence"("itemId");

-- AddForeignKey
ALTER TABLE "cancel_order_evidence" ADD CONSTRAINT "cancel_order_evidence_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
