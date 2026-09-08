/*
  Warnings:

  - You are about to drop the column `user1Id` on the `chatGroups` table. All the data in the column will be lost.
  - You are about to drop the column `user2Id` on the `chatGroups` table. All the data in the column will be lost.
  - Added the required column `buyerId` to the `chatGroups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `chatGroups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chatGroups" DROP CONSTRAINT "chatGroups_user1Id_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatGroups" DROP CONSTRAINT "chatGroups_user2Id_fkey";

-- DropIndex
DROP INDEX "public"."chatGroups_user1Id_user2Id_idx";

-- DropIndex
DROP INDEX "public"."chatGroups_user2Id_user1Id_idx";

-- AlterTable
ALTER TABLE "chatGroups" DROP COLUMN "user1Id",
DROP COLUMN "user2Id",
ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "chatGroups_buyerId_sellerId_idx" ON "chatGroups"("buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "chatGroups_sellerId_buyerId_idx" ON "chatGroups"("sellerId", "buyerId");

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
