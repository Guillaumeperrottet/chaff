-- CreateEnum
CREATE TYPE "PayrollImportType" AS ENUM ('GASTROTIME', 'MANUAL_CSV', 'MANUAL_ENTRY');

-- CreateTable
CREATE TABLE "payroll_import_history" (
    "id" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "importType" "PayrollImportType" NOT NULL DEFAULT 'GASTROTIME',
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGrossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultHourlyRate" DOUBLE PRECISION,
    "status" "ImportStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "payroll_import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_import_employees" (
    "id" TEXT NOT NULL,
    "importHistoryId" TEXT NOT NULL,
    "employeeId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "rateSource" TEXT NOT NULL,
    "employeeFound" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payroll_import_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_import_history_mandateId_period_idx" ON "payroll_import_history"("mandateId", "period");

-- CreateIndex
CREATE INDEX "payroll_import_history_importDate_idx" ON "payroll_import_history"("importDate");

-- CreateIndex
CREATE INDEX "payroll_import_employees_importHistoryId_idx" ON "payroll_import_employees"("importHistoryId");

-- AddForeignKey
ALTER TABLE "payroll_import_history" ADD CONSTRAINT "payroll_import_history_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_import_employees" ADD CONSTRAINT "payroll_import_employees_importHistoryId_fkey" FOREIGN KEY ("importHistoryId") REFERENCES "payroll_import_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
