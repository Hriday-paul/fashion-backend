/*
  Warnings:

  - You are about to drop the column `authDetailsId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_authDetailsId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "authDetailsId";
