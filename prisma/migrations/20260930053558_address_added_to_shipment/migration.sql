/*
  Warnings:

  - Added the required column `destinationId` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originId` to the `shipments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "destinationId" TEXT NOT NULL,
ADD COLUMN     "originId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_originId_fkey" FOREIGN KEY ("originId") REFERENCES "billing_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "billing_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
