-- CreateTable
CREATE TABLE "companies" (
    "company_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(500),
    "address" TEXT,
    "email" VARCHAR(255),
    "phone" VARCHAR(15),
    "subscription_expiry_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "customer_type" VARCHAR(50) NOT NULL,
    "national_id" CHAR(14) NOT NULL,
    "id_card_image" VARCHAR(500),
    "primary_number" VARCHAR(15) NOT NULL,
    "secondary_number" VARCHAR(15),
    "governorate" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "national_id" CHAR(14) NOT NULL,
    "id_card_image" VARCHAR(500),
    "role" VARCHAR(50) NOT NULL,
    "primary_number" VARCHAR(15) NOT NULL,
    "secondary_number" VARCHAR(15),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "governorate" VARCHAR(100) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "is_employed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_info" TEXT NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "supplier_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "accessories" (
    "accessory_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "supplier_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "accessories_pkey" PRIMARY KEY ("accessory_id")
);

-- CreateTable
CREATE TABLE "product_accessories" (
    "product_accessory_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "accessory_id" INTEGER NOT NULL,

    CONSTRAINT "product_accessories_pkey" PRIMARY KEY ("product_accessory_id")
);

-- CreateTable
CREATE TABLE "services" (
    "service_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "sales_rep_id" INTEGER NOT NULL,
    "technician_id" INTEGER,
    "company_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sale_type" VARCHAR(20) NOT NULL,
    "maintenance_period" INTEGER,
    "paid_at_contract" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_at_installation" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "installation_cost_type" VARCHAR(20) NOT NULL DEFAULT 'Percentage',
    "installation_cost_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "contract_date" TIMESTAMP(6) NOT NULL,
    "installation_date" TIMESTAMP(6),
    "contract_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "invoice_item_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "accessory_id" INTEGER,
    "service_id" INTEGER,
    "company_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("invoice_item_id")
);

-- CreateTable
CREATE TABLE "installments" (
    "installment_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "number_of_months" INTEGER NOT NULL,
    "monthly_installment" DECIMAL(10,2) NOT NULL,
    "collection_start_date" TIMESTAMP(6) NOT NULL,
    "collection_end_date" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("installment_id")
);

-- CreateTable
CREATE TABLE "installment_payments" (
    "payment_id" SERIAL NOT NULL,
    "installment_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "amount_due" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "carryover_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overdue_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "due_date" TIMESTAMP(6) NOT NULL,
    "payment_date" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installment_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "maintenances" (
    "maintenance_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "technician_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "maintenance_date" TIMESTAMP(6) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("maintenance_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE INDEX "customers_national_id_idx" ON "customers"("national_id");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "suppliers_company_id_idx" ON "suppliers"("company_id");

-- CreateIndex
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "accessories_company_id_idx" ON "accessories"("company_id");

-- CreateIndex
CREATE INDEX "accessories_supplier_id_idx" ON "accessories"("supplier_id");

-- CreateIndex
CREATE INDEX "product_accessories_product_id_idx" ON "product_accessories"("product_id");

-- CreateIndex
CREATE INDEX "product_accessories_accessory_id_idx" ON "product_accessories"("accessory_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_accessories_product_id_accessory_id_key" ON "product_accessories"("product_id", "accessory_id");

-- CreateIndex
CREATE INDEX "services_company_id_idx" ON "services"("company_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_idx" ON "invoices"("company_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_sales_rep_id_idx" ON "invoices"("sales_rep_id");

-- CreateIndex
CREATE INDEX "invoices_technician_id_idx" ON "invoices"("technician_id");

-- CreateIndex
CREATE INDEX "invoices_sale_type_idx" ON "invoices"("sale_type");

-- CreateIndex
CREATE INDEX "invoices_contract_date_idx" ON "invoices"("contract_date");

-- CreateIndex
CREATE INDEX "invoice_items_company_id_idx" ON "invoice_items"("company_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "invoice_items_accessory_id_idx" ON "invoice_items"("accessory_id");

-- CreateIndex
CREATE INDEX "invoice_items_service_id_idx" ON "invoice_items"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "installments_invoice_id_key" ON "installments"("invoice_id");

-- CreateIndex
CREATE INDEX "installments_invoice_id_idx" ON "installments"("invoice_id");

-- CreateIndex
CREATE INDEX "installment_payments_installment_id_idx" ON "installment_payments"("installment_id");

-- CreateIndex
CREATE INDEX "installment_payments_customer_id_idx" ON "installment_payments"("customer_id");

-- CreateIndex
CREATE INDEX "installment_payments_status_idx" ON "installment_payments"("status");

-- CreateIndex
CREATE INDEX "installment_payments_due_date_idx" ON "installment_payments"("due_date");

-- CreateIndex
CREATE INDEX "maintenances_company_id_idx" ON "maintenances"("company_id");

-- CreateIndex
CREATE INDEX "maintenances_customer_id_idx" ON "maintenances"("customer_id");

-- CreateIndex
CREATE INDEX "maintenances_technician_id_idx" ON "maintenances"("technician_id");

-- CreateIndex
CREATE INDEX "maintenances_status_idx" ON "maintenances"("status");

-- CreateIndex
CREATE INDEX "maintenances_maintenance_date_idx" ON "maintenances"("maintenance_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_accessories" ADD CONSTRAINT "product_accessories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_accessories" ADD CONSTRAINT "product_accessories_accessory_id_fkey" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("accessory_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_accessory_id_fkey" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("accessory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("installment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_payments" ADD CONSTRAINT "installment_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;
