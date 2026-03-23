-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "billing_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "full_name" TEXT,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "zip_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "billing_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_addresses_userId_key" ON "billing_addresses"("userId");

-- AddForeignKey
ALTER TABLE "billing_addresses" ADD CONSTRAINT "billing_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
