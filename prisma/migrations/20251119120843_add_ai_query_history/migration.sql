-- CreateTable
CREATE TABLE "ai_query_history" (
    "query_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "query_text" TEXT NOT NULL,
    "query_type" VARCHAR(50) NOT NULL,
    "generated_sql" TEXT,
    "results" JSONB DEFAULT '[]',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "execution_time" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_query_history_pkey" PRIMARY KEY ("query_id")
);

-- CreateIndex
CREATE INDEX "ai_query_history_user_id_idx" ON "ai_query_history"("user_id");

-- CreateIndex
CREATE INDEX "ai_query_history_company_id_idx" ON "ai_query_history"("company_id");

-- CreateIndex
CREATE INDEX "ai_query_history_query_type_idx" ON "ai_query_history"("query_type");

-- CreateIndex
CREATE INDEX "ai_query_history_created_at_idx" ON "ai_query_history"("created_at");

-- AddForeignKey
ALTER TABLE "ai_query_history" ADD CONSTRAINT "ai_query_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_query_history" ADD CONSTRAINT "ai_query_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;
