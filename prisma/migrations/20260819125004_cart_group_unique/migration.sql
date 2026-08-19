/*
  Warnings:

  - A unique constraint covering the columns `[sellerId,userId]` on the table `carts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."carts_sellerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "carts_sellerId_userId_key" ON "carts"("sellerId", "userId");
