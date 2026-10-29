/*
  Warnings:

  - Added the required column `msgType` to the `DonationThanksMSg` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ThanksMessageType" AS ENUM ('SELL', 'DIRECT', 'CLOTH');

-- AlterTable
ALTER TABLE "DonationThanksMSg" ADD COLUMN     "msgType" "ThanksMessageType" NOT NULL;
