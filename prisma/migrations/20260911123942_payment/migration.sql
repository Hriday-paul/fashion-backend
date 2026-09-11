/*
  Warnings:

  - The values [CANCELLED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DELIVERED,FAILED,CANCELLED,DISPUTED] on the enum `StripePaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSED', 'FAILED', 'REFUNDED');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StripePaymentStatus_new" AS ENUM ('PENDING', 'ESCROWED', 'RELEASED', 'REFUNDED');
ALTER TABLE "public"."payments" ALTER COLUMN "stripe_status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "stripe_status" TYPE "StripePaymentStatus_new" USING ("stripe_status"::text::"StripePaymentStatus_new");
ALTER TYPE "StripePaymentStatus" RENAME TO "StripePaymentStatus_old";
ALTER TYPE "StripePaymentStatus_new" RENAME TO "StripePaymentStatus";
DROP TYPE "public"."StripePaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "stripe_status" SET DEFAULT 'PENDING';
COMMIT;
