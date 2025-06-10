/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `hasCustomPricing` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `trialDays` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Plan` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `mandates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstablishmentIcon" AS ENUM ('BUILDING2', 'MAP_PIN', 'HOTEL', 'UTENSILS', 'TENT', 'WAVES', 'TREE_PINE', 'COFFEE', 'SHOPPING_BAG', 'BRIEFCASE', 'HEART', 'MUSIC');

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "createdAt",
DROP COLUMN "features",
DROP COLUMN "hasCustomPricing",
DROP COLUMN "trialDays",
DROP COLUMN "updatedAt",
ADD COLUMN     "maxMandates" INTEGER;

-- AlterTable
ALTER TABLE "mandates" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "establishment_types" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" "EstablishmentIcon" NOT NULL DEFAULT 'BUILDING2',
    "iconColor" TEXT NOT NULL DEFAULT 'text-purple-600',
    "bgColor" TEXT NOT NULL DEFAULT 'bg-purple-100',
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishment_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "establishment_types_organizationId_idx" ON "establishment_types"("organizationId");

-- CreateIndex
CREATE INDEX "establishment_types_isCustom_idx" ON "establishment_types"("isCustom");

-- CreateIndex
CREATE INDEX "establishment_types_isActive_idx" ON "establishment_types"("isActive");

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_types" ADD CONSTRAINT "establishment_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
