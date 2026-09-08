/*
  Warnings:

  - Added the required column `itemsTitle` to the `assistent_sells` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assistent_sells" ADD COLUMN     "itemsTitle" TEXT NOT NULL;
