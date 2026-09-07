/*
  Warnings:

  - Made the column `donationPct` on table `assistent_sells` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "assistent_sells" ALTER COLUMN "donationPct" SET NOT NULL;
