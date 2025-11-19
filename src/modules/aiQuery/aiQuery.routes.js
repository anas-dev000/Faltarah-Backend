// ==========================================
// aiQuery.routes.js - Enhanced Routes
// ==========================================

import * as aiQueryController from "./aiQuery.controller.js";
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
   * استعلام مع streaming (للعرض التدريجي)
   */
  fastify.post("/stream", {
    preHandler: [authenticate],
    handler: aiQueryController.streamQuery,
  });
}
