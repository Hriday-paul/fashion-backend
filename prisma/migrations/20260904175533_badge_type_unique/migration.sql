/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Badge_type_key" ON "Badge"("type");
