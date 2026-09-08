/*
  Warnings:

  - You are about to drop the `chatParticipants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[offerId]` on the table `messages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user1Id` to the `chatGroups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Id` to the `chatGroups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chatParticipants" DROP CONSTRAINT "chatParticipants_chatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatParticipants" DROP CONSTRAINT "chatParticipants_userId_fkey";

-- AlterTable
ALTER TABLE "chatGroups" ADD COLUMN     "user1Id" TEXT NOT NULL,
ADD COLUMN     "user2Id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "offerId" TEXT;

-- DropTable
DROP TABLE "public"."chatParticipants";

-- CreateTable
CREATE TABLE "chatProdItems" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatProdItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chatProdItems_chatId_productId_idx" ON "chatProdItems"("chatId", "productId");

-- CreateIndex
CREATE INDEX "chatProdItems_productId_chatId_idx" ON "chatProdItems"("productId", "chatId");

-- CreateIndex
CREATE INDEX "chatGroups_user1Id_user2Id_idx" ON "chatGroups"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "chatGroups_user2Id_user1Id_idx" ON "chatGroups"("user2Id", "user1Id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_offerId_key" ON "messages"("offerId");

-- CreateIndex
CREATE INDEX "messages_chatId_isSeen_idx" ON "messages"("chatId", "isSeen");

-- CreateIndex
CREATE INDEX "messages_chatId_receiverId_isSeen_idx" ON "messages"("chatId", "receiverId", "isSeen");

-- CreateIndex
CREATE INDEX "messages_receiverId_isSeen_idx" ON "messages"("receiverId", "isSeen");

-- CreateIndex
CREATE INDEX "messages_offerId_idx" ON "messages"("offerId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatGroups" ADD CONSTRAINT "chatGroups_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatProdItems" ADD CONSTRAINT "chatProdItems_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chatGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatProdItems" ADD CONSTRAINT "chatProdItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
