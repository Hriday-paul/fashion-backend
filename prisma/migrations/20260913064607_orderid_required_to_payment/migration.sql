/*
  Warnings:

  - You are about to drop the column `cartGroupId` on the `payments` table. All the data in the column will be lost.
  - Made the column `orderId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_cartGroupId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "cartGroupId",
ALTER COLUMN "orderId" SET NOT NULL;
