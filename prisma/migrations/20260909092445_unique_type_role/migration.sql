/*
  Warnings:

  - A unique constraint covering the columns `[type,role]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Badge_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "Badge_type_role_key" ON "Badge"("type", "role");
