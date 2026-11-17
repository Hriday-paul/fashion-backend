-- DropForeignKey
ALTER TABLE "sizes" DROP CONSTRAINT "sizes_parentId_fkey";

-- AddForeignKey
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
