/*
  Warnings:

  - Made the column `donorId` on table `DirectDonation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DirectDonation" ALTER COLUMN "donorId" SET NOT NULL;
