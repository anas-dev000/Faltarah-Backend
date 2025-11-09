-- AlterTable
ALTER TABLE "maintenances" ALTER COLUMN "status" SET DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "customer_maintenance_statuses" (
    "status_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "inactive_reason" TEXT,
    "notes" TEXT,
    "status_changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_maintenance_statuses_pkey" PRIMARY KEY ("status_id")
);

-- CreateIndex
CREATE INDEX "customer_maintenance_statuses_company_id_idx" ON "customer_maintenance_statuses"("company_id");

-- CreateIndex
CREATE INDEX "customer_maintenance_statuses_customer_id_idx" ON "customer_maintenance_statuses"("customer_id");

-- CreateIndex
CREATE INDEX "customer_maintenance_statuses_status_idx" ON "customer_maintenance_statuses"("status");

-- AddForeignKey
ALTER TABLE "customer_maintenance_statuses" ADD CONSTRAINT "customer_maintenance_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_maintenance_statuses" ADD CONSTRAINT "customer_maintenance_statuses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
