// ==========================================
// aiQuery.routes.js - API Routes (FIXED)
// ==========================================

import * as aiQueryController from "./aiQuery.controller.js";
import { indexCompanyData } from "../../shared/utils/rag.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { querySchema } from "./aiQuery.schema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";

const validateBody = (schema) => {
  return async (request, reply) => {
    const validation = validateSchema(request.body, schema);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation Error",
        details: validation.errors,
      });
    }
  };
};

export default async function aiQueryRoutes(fastify) {
  /**
   * POST /api/ai-query/query
   * معالجة الاستعلام الذكي الرئيسي
   */
  fastify.post("/query", {
    preHandler: [authenticate, validateBody(querySchema)],
    handler: aiQueryController.processQuery,
  });

  /**
   * GET /api/ai-query/history
   * جلب سجل الاستعلامات السابقة
   */
  fastify.get("/history", {
    preHandler: [authenticate],
    handler: aiQueryController.getHistory,
  });

  /**
   * GET /api/ai-query/suggestions
   * جلب الاقتراحات السريعة
   */
  fastify.get("/suggestions", {
    preHandler: [authenticate],
    handler: aiQueryController.getSuggestions,
  });

  /**
   * POST /api/ai-query/save-suggestion
   * حفظ استعلام كاقتراح
   */
  fastify.post("/save-suggestion", {
    preHandler: [authenticate],
    handler: aiQueryController.saveSuggestion,
  });

  /**
   * DELETE /api/ai-query/suggestion/:id
   * حذف اقتراح محفوظ
   */
  fastify.delete("/suggestion/:id", {
    preHandler: [authenticate],
    handler: aiQueryController.deleteSuggestion,
  });

  /**
   * POST /api/ai-query/stream
   * استعلام مع streaming
   */
  fastify.post("/stream", {
    preHandler: [authenticate],
    handler: aiQueryController.streamQuery,
  });

  /**
   * POST /api/ai-query/index-company
   * فهرسة بيانات الشركة
   *
   * ✅ FIXED: استخدام Raw SQL بدلاً من Prisma model
   */
  fastify.post("/index-company", {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      try {
        const { companyId } = request.body;
        const currentUser = request.user;

        // التحقق من الصلاحية
        if (
          currentUser.role !== "developer" &&
          currentUser.companyId !== companyId
        ) {
          return reply.status(403).send({
            success: false,
            error: "ليس لديك صلاحية لفهرسة هذه الشركة",
          });
        }

        if (!companyId) {
          return reply.status(400).send({
            success: false,
            error: "companyId مطلوب",
          });
        }

        console.log(`🔄 بدء فهرسة الشركة ${companyId}...`);

        const results = await indexCompanyData(
          request.server.prisma,
          parseInt(companyId)
        );

        return reply.send({
          success: true,
          data: results,
          message: "تم فهرسة البيانات بنجاح",
          total: results.reduce((sum, r) => sum + (r.indexed || 0), 0),
        });
      } catch (error) {
        console.error("❌ Index error:", error);
        return reply.status(500).send({
          success: false,
          error: error.message || "فشل في فهرسة البيانات",
        });
      }
    },
  });

  /**
   * GET /api/ai-query/index-status/:companyId
   * التحقق من حالة الفهرسة
   *
   * ✅ FIXED: استخدام Raw SQL
   */
  fastify.get("/index-status/:companyId", {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      try {
        const { companyId } = request.params;
        const currentUser = request.user;

        if (
          currentUser.role !== "developer" &&
          currentUser.companyId !== parseInt(companyId)
        ) {
          return reply.status(403).send({
            success: false,
            error: "ليس لديك صلاحية",
          });
        }

        // ✅ استخدام Raw SQL بدلاً من Prisma
        const counts = await request.server.prisma.$queryRaw`
          SELECT entity, COUNT(*)::int as count
          FROM embedding_store
          WHERE company_id = ${parseInt(companyId)}
          GROUP BY entity
        `;

        const total = counts.reduce((sum, c) => sum + c.count, 0);

        return reply.send({
          success: true,
          data: {
            companyId: parseInt(companyId),
            totalEmbeddings: total,
            byEntity: counts.map((c) => ({
              entity: c.entity,
              count: c.count,
            })),
            indexed: total > 0,
          },
        });
      } catch (error) {
        console.error("❌ Index status error:", error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });
}
