-- DropForeignKey
ALTER TABLE "public"."assistentSellCharities" DROP CONSTRAINT "assistentSellCharities_assistentSellId_fkey";

-- DropForeignKey
ALTER TABLE "public"."assistentSellCharities" DROP CONSTRAINT "assistentSellCharities_charityId_fkey";

-- AddForeignKey
ALTER TABLE "assistentSellCharities" ADD CONSTRAINT "assistentSellCharities_assistentSellId_fkey" FOREIGN KEY ("assistentSellId") REFERENCES "assistent_sells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistentSellCharities" ADD CONSTRAINT "assistentSellCharities_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
