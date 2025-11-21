-- CreateTable
CREATE TABLE "embedding_store" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "entity" VARCHAR(50),
    "row_id" INTEGER,
    "text" TEXT,
    "embedding" DOUBLE PRECISION[],
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embedding_store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_company_entity" ON "embedding_store"("company_id", "entity");

-- CreateIndex
CREATE INDEX "embedding_store_company_id_idx" ON "embedding_store"("company_id");

-- CreateIndex
CREATE INDEX "embedding_store_entity_idx" ON "embedding_store"("entity");
