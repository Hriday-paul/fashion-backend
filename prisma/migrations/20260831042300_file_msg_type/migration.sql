-- CreateEnum
CREATE TYPE "FileMessageType" AS ENUM ('IMAGE', 'DOCUMENT');

-- AlterTable
ALTER TABLE "document_messages" ADD COLUMN     "type" "FileMessageType" NOT NULL DEFAULT 'IMAGE';
