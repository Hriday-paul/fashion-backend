/*
  Warnings:

  - You are about to drop the column `meterials` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SizeFormat" AS ENUM ('UK', 'US', 'EU', 'FR', 'IT', 'LETTER');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "meterials",
ADD COLUMN     "SizeFormat" "SizeFormat" NOT NULL DEFAULT 'US';
