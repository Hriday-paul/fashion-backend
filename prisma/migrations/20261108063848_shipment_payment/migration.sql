/*
  Warnings:

  - A unique constraint covering the columns `[shipmentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "shipmentId" TEXT;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "payments_shipmentId_key" ON "payments"("shipmentId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
