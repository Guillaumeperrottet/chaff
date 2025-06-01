-- CreateTable
CREATE TABLE "plan_change_audit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromPlan" TEXT,
    "toPlan" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "notes" TEXT,

    CONSTRAINT "plan_change_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_change_audit_organizationId_idx" ON "plan_change_audit"("organizationId");

-- CreateIndex
CREATE INDEX "plan_change_audit_status_idx" ON "plan_change_audit"("status");

-- AddForeignKey
ALTER TABLE "plan_change_audit" ADD CONSTRAINT "plan_change_audit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
