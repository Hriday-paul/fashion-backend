/*
  Warnings:

  - You are about to drop the column `last_login` on the `auths` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `auths` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - Added the required column `email` to the `auths` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fname` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Approval_Status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "auths" DROP COLUMN "last_login",
DROP COLUMN "phone",
ADD COLUMN     "approval_status" "Approval_Status" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "last_loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "gender",
DROP COLUMN "name",
ADD COLUMN     "business_tags" TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "fname" TEXT NOT NULL,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "lname" TEXT,
ADD COLUMN     "mission" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zip_code" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "account_documents" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "account_documents" ADD CONSTRAINT "account_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
