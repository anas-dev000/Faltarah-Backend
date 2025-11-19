-- CreateTable
CREATE TABLE "saved_query_suggestions" (
    "suggestion_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "query_text" TEXT NOT NULL,
    "query_type" VARCHAR(50) NOT NULL,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "saved_query_suggestions_pkey" PRIMARY KEY ("suggestion_id")
);

-- CreateIndex
CREATE INDEX "saved_query_suggestions_user_id_idx" ON "saved_query_suggestions"("user_id");

-- CreateIndex
CREATE INDEX "saved_query_suggestions_company_id_idx" ON "saved_query_suggestions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_query_suggestions_user_id_query_text_key" ON "saved_query_suggestions"("user_id", "query_text");

-- AddForeignKey
ALTER TABLE "saved_query_suggestions" ADD CONSTRAINT "saved_query_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_query_suggestions" ADD CONSTRAINT "saved_query_suggestions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;
