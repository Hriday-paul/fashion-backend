-- DropForeignKey
ALTER TABLE "public"."DirectDonation" DROP CONSTRAINT "DirectDonation_donorId_fkey";

-- AddForeignKey
ALTER TABLE "DirectDonation" ADD CONSTRAINT "DirectDonation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
