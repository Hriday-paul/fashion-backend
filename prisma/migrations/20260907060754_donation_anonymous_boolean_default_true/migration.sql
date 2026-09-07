-- AlterTable
ALTER TABLE "assistent_sells" ADD COLUMN     "donationAnonymous" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "donationAnonymous" BOOLEAN NOT NULL DEFAULT true;
