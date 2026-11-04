-- CreateEnum
CREATE TYPE "MsgType" AS ENUM ('SYSTEM', 'OFFER', 'DIRECT');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "type" "MsgType" NOT NULL DEFAULT 'DIRECT',
ALTER COLUMN "senderId" DROP NOT NULL,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "system_messages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "msgForUserId" TEXT NOT NULL,
    "msgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_messages_msgId_key" ON "system_messages"("msgId");

-- CreateIndex
CREATE INDEX "system_messages_msgForUserId_idx" ON "system_messages"("msgForUserId");

-- AddForeignKey
ALTER TABLE "system_messages" ADD CONSTRAINT "system_messages_msgForUserId_fkey" FOREIGN KEY ("msgForUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_messages" ADD CONSTRAINT "system_messages_msgId_fkey" FOREIGN KEY ("msgId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
