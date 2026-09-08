/*
  Warnings:

  - A unique constraint covering the columns `[user1Id,user2Id]` on the table `chatGroups` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chatGroups_user1Id_user2Id_key" ON "chatGroups"("user1Id", "user2Id");
