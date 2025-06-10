-- AlterTable
ALTER TABLE "mandates" ADD COLUMN     "establishmentTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_establishmentTypeId_fkey" FOREIGN KEY ("establishmentTypeId") REFERENCES "establishment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
