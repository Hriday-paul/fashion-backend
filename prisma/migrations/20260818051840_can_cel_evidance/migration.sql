/*
  Warnings:

  - You are about to drop the column `itemId` on the `cancel_order_evidence` table. All the data in the column will be lost.
  - Added the required column `groupId` to the `cancel_order_evidence` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cancel_order_evidence" DROP CONSTRAINT "cancel_order_evidence_itemId_fkey";

-- DropIndex
DROP INDEX "public"."cancel_order_evidence_itemId_idx";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "cancellationRequestAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cancel_order_evidence" DROP COLUMN "itemId",
ADD COLUMN     "groupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cancel_evidence_group" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancel_evidence_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancel_evidence_group_orderItemId_key" ON "cancel_evidence_group"("orderItemId");

-- CreateIndex
CREATE INDEX "cancel_evidence_group_orderItemId_idx" ON "cancel_evidence_group"("orderItemId");

-- CreateIndex
CREATE INDEX "cancel_order_evidence_groupId_idx" ON "cancel_order_evidence"("groupId");

-- AddForeignKey
ALTER TABLE "cancel_evidence_group" ADD CONSTRAINT "cancel_evidence_group_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancel_order_evidence" ADD CONSTRAINT "cancel_order_evidence_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "cancel_evidence_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
