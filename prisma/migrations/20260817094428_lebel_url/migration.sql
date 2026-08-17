-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "isLebelGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lebelUrl" TEXT;
