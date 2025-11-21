// ==========================================
// aiQuery.controller.js - Request Handlers
// ==========================================
// وظيفة الملف: معالجة جميع طلبات الـ API الخاصة بـ AI Query
// - استقبال الطلبات من العملاء
// - التحقق من صحة البيانات
// - استدعاء خدمات الأعمال
// - إرسال الردود المناسبة

import * as aiQueryService from "./aiQuery.service.js";

/**
 * معالجة الاستعلام الذكي الرئيسي
 * POST /api/ai-query/query
 *
 * @description
 * - يستقبل النص الخاص بالاستعلام من المستخدم
 * - يحلل نوع الاستعلام تلقائياً (عملاء، منتجات، إلخ)
 * - ينفذ استعلام قاعدة البيانات المناسب
 * - ينشئ إجابة ذكية بالعربية
 * - يسجل الاستعلام في السجل
 *
 * @param {Object} request - كائن الطلب
 * @param {string} request.body.query - نص الاستعلام
 * @returns {Object} النتائج مع الإجابة الذكية
 */
export const processQuery = async (request, reply) => {
  const { query } = request.body;
  const currentUser = request.user; // المستخدم الحالي من JWT

  if (!query || query.trim().length === 0) {
    return reply.status(400).send({
      success: false,
      error: "يجب إدخال نص الاستعلام",
    });
  }

  try {
    const result = await aiQueryService.processSmartQuery(
      request.server.prisma,
      query,
      currentUser
    );

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * جلب سجل الاستعلامات
 * GET /api/ai-query/history?limit=10
 */
export const getHistory = async (request, reply) => {
  const currentUser = request.user;
  const { limit } = request.query;

  try {
    const history = await aiQueryService.getUserQueryHistory(
      request.server.prisma,
      currentUser,
      limit ? parseInt(limit) : 10
    );

    return reply.send({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    return reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * جلب الاقتراحات السريعة
 * GET /api/ai-query/suggestions
 */
export const getSuggestions = async (request, reply) => {
  const currentUser = request.user;

  try {
    const suggestions = await aiQueryService.getQuerySuggestions(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    return reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حفظ استعلام كاقتراح
 * POST /api/ai-query/save-suggestion
 */
export const saveSuggestion = async (request, reply) => {
  const { queryText, queryType } = request.body;
  const currentUser = request.user;

  if (!queryText || !queryType) {
    return reply.status(400).send({
      success: false,
      error: "يجب تحديد نص الاستعلام والنوع",
    });
  }

  try {
    const result = await aiQueryService.saveSuggestion(
      request.server.prisma,
      currentUser,
      queryText,
      queryType
    );

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * حذف اقتراح محفوظ
 * DELETE /api/ai-query/suggestion/:id
 */
export const deleteSuggestion = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  if (!id) {
    return reply.status(400).send({
      success: false,
      error: "يجب تحديد معرّف الاقتراح",
    });
  }

  try {
    const result = await aiQueryService.deleteSuggestion(
      request.server.prisma,
      currentUser,
      id
    );

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * استعلام مع streaming
 * POST /api/ai-query/stream
 */
export const streamQuery = async (request, reply) => {
  const { query } = request.body;
  const currentUser = request.user;

  if (!query || query.trim().length === 0) {
    return reply.status(400).send({
      success: false,
      error: "يجب إدخال نص الاستعلام",
    });
  }

  try {
    // تعيين رؤوس الـ response للـ streaming
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // محاكاة الـ streaming
    const chunks = [
      "جاري التحليل",
      "...",
      " جاري البحث",
      "...",
      " جاري التنسيق",
      "...",
      " تم!",
    ];

    for (const chunk of chunks) {
      reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // الآن معالجة الاستعلام الفعلي
    const result = await aiQueryService.processSmartQuery(
      request.server.prisma,
      query,
      currentUser
    );

    // إرسال النتيجة النهائية
    reply.raw.write(`data: ${JSON.stringify({ complete: true, result })}\n\n`);
    reply.raw.end();
  } catch (error) {
    reply.raw.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    reply.raw.end();
  }
};
