/*
  Warnings:

  - You are about to drop the `billing_addresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."billing_addresses" DROP CONSTRAINT "billing_addresses_userId_fkey";

-- DropTable
DROP TABLE "public"."billing_addresses";

-- CreateTable
CREATE TABLE "billing_details" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "full_name" TEXT,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "zip_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contact" TEXT,

    CONSTRAINT "billing_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_details_userId_key" ON "billing_details"("userId");

-- AddForeignKey
ALTER TABLE "billing_details" ADD CONSTRAINT "billing_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
