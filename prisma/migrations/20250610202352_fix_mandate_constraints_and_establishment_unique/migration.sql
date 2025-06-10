/*
  Warnings:

  - You are about to drop the column `establishmentTypeId` on the `mandates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[label,organizationId]` on the table `establishment_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,organizationId]` on the table `mandates` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `group` on the `mandates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "mandates" DROP CONSTRAINT "mandates_establishmentTypeId_fkey";

-- DropIndex
DROP INDEX "mandates_name_key";

-- AlterTable
ALTER TABLE "mandates" DROP COLUMN "establishmentTypeId",
DROP COLUMN "group",
ADD COLUMN     "group" TEXT NOT NULL;

-- DropEnum
DROP TYPE "MandateGroup";

-- CreateIndex
CREATE UNIQUE INDEX "establishment_types_label_organizationId_key" ON "establishment_types"("label", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "mandates_name_organizationId_key" ON "mandates"("name", "organizationId");
