-- CreateEnum
CREATE TYPE "PayrollSource" AS ENUM ('MANUAL', 'CALCULATED', 'BOTH');

-- CreateTable
CREATE TABLE "manual_payroll_entries" (
    "id" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "socialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "employeeCount" INTEGER,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_summary" (
    "id" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueEntries" INTEGER NOT NULL DEFAULT 0,
    "manualPayrollAmount" DOUBLE PRECISION,
    "calculatedPayrollAmount" DOUBLE PRECISION,
    "payrollSource" "PayrollSource" NOT NULL DEFAULT 'MANUAL',
    "payrollToRevenueRatio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_payroll_entries_mandateId_year_idx" ON "manual_payroll_entries"("mandateId", "year");

-- CreateIndex
CREATE INDEX "manual_payroll_entries_year_month_idx" ON "manual_payroll_entries"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "manual_payroll_entries_mandateId_year_month_key" ON "manual_payroll_entries"("mandateId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_summary_mandateId_year_month_key" ON "payroll_summary"("mandateId", "year", "month");

-- AddForeignKey
ALTER TABLE "manual_payroll_entries" ADD CONSTRAINT "manual_payroll_entries_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_summary" ADD CONSTRAINT "payroll_summary_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
