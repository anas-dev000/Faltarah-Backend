// ==========================================
// aiQuery.routes.js - API Routes Registration
// ==========================================

// وظيفة الملف: تسجيل جميع مسارات API الخاصة بـ AI Query
//
// المسارات المتوفرة (6 مسارات):
// 1. POST /api/ai-query/query - معالجة الاستعلام الذكي الرئيسي
// 2. GET /api/ai-query/history - جلب السجل السابق للاستعلامات
// 3. GET /api/ai-query/suggestions - جلب الاقتراحات المحفوظة
// 4. POST /api/ai-query/save-suggestion - حفظ استعلام جديد
// 5. DELETE /api/ai-query/suggestion/:id - حذف استعلام محفوظ
// 6. POST /api/ai-query/stream - بث النتائج عبر Server-Sent Events

// ملاحظات:
// - جميع المسارات تتطلب مصادقة JWT
// - جميع البيانات يتم تصفيتها حسب الشركة

import * as aiQueryController from "./aiQuery.controller.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { querySchema } from "./aiQuery.schema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";

/**
 * دالة التحقق من صحة البيانات
 * تستخدم Zod schema للتحقق من أن البيانات المرسلة صحيحة
 *
 * @param {Object} schema - مخطط Zod للتحقق
 * @returns {Function} middleware للتحقق
 */
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

/**
 * تسجيل جميع مسارات API
 *
 * @description
 * تعريف جميع المسارات الخاصة بـ AI Query
 * كل مسار يحتوي على:
 * - preHandler: قائمة من middleware (المصادقة والتحقق)
 * - handler: دالة المعالجة الرئيسية
 *
 * @param {Object} fastify - تطبيق Fastify الرئيسي
 */
export default async function aiQueryRoutes(fastify) {
  /**
   * POST /api/ai-query/query
   * معالجة الاستعلام الذكي الرئيسي
   *
   * الوظيفة: استقبال نص الاستعلام من المستخدم ومعالجته
   * المتطلبات: JWT token في Authorization header
   * البيانات المرسلة: { query: "نص الاستعلام" }
   * الاستجابة: { success, data: { queryType, results, aiAnswer, ... } }
   */
  fastify.post("/query", {
    preHandler: [authenticate, validateBody(querySchema)],
    handler: aiQueryController.processQuery,
  });

  /**
   * GET /api/ai-query/history
   * جلب سجل الاستعلامات السابقة
   *
   * الوظيفة: عرض جميع الاستعلامات التي قام بها المستخدم سابقاً
   * المتطلبات: JWT token
   * البارامترات: limit (عدد النتائج)، offset (للترقيم)
   * الاستجابة: { success, data: [استعلامات سابقة] }
   */
  fastify.get("/history", {
    preHandler: [authenticate],
    handler: aiQueryController.getHistory,
  });

  /**
   * GET /api/ai-query/suggestions
   * جلب الاقتراحات السريعة
   *
   * الوظيفة: عرض قائمة بالاستعلامات المقترحة التي يمكن للمستخدم استخدامها
   * المتطلبات: JWT token
   * الاستجابة: { success, data: [اقتراحات] }
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
