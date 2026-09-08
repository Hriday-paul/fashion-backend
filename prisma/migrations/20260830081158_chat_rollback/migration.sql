/*
  Warnings:

  - You are about to drop the column `buyerId` on the `chatGroups` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `chatGroups` table. All the data in the column will be lost.
  - You are about to drop the `chatProdItems` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user1Id` to the `chatGroups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Id` to the `chatGroups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chatGroups" DROP CONSTRAINT "chatGroups_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatGroups" DROP CONSTRAINT "chatGroups_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatProdItems" DROP CONSTRAINT "chatProdItems_chatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatProdItems" DROP CONSTRAINT "chatProdItems_productId_fkey";

-- DropIndex
DROP INDEX "public"."chatGroups_buyerId_sellerId_idx";

-- DropIndex
DROP INDEX "public"."chatGroups_sellerId_buyerId_idx";

-- AlterTable
ALTER TABLE "chatGroups" DROP COLUMN "buyerId",
DROP COLUMN "sellerId",
ADD COLUMN     "user1Id" TEXT NOT NULL,
ADD COLUMN     "user2Id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."chatProdItems";

-- CreateIndex
CREATE INDEX "chatGroups_user1Id_user2Id_idx" ON "chatGroups"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "chatGroups_user2Id_user1Id_idx" ON "chatGroups"("user2Id", "user1Id");

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
