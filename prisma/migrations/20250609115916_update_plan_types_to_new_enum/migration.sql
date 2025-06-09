/*
  Warnings:

  - The values [PERSONAL,PROFESSIONAL,ENTERPRISE] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('FREE', 'PREMIUM', 'SUPER_ADMIN', 'ILLIMITE', 'CUSTOM');
ALTER TABLE "Plan" ALTER COLUMN "name" TYPE "PlanType_new" USING ("name"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "PlanType_old";
COMMIT;
