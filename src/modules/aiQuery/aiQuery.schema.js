// ==========================================
// aiQuery.schema.js - Validation Schemas
// ==========================================
// وظيفة الملف: تعريف مخططات التحقق من البيانات
//
// المسؤوليات:
// - التحقق من أن البيانات المرسلة صحيحة
// - التحقق من أنواع البيانات
// - التحقق من الحد الأدنى والأقصى للطول
// - إرجاع رسائل خطأ واضحة بالعربية
//
// التقنية: Zod schema للتحقق الآمن من البيانات

/**
 * مخطط التحقق من الاستعلام
 *
 * @description
 * يتحقق من أن نص الاستعلام:
 * - موجود وليس فارغ
 * - من نوع string
 * - لا يتجاوز 500 حرف
 *
 * @type {Object}
 * @property {string} query - نص الاستعلام
 * @property {number} minLength - الحد الأدنى: 1 حرف
 * @property {number} maxLength - الحد الأقصى: 500 حرف
 */
export const querySchema = {
  query: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("نص الاستعلام مطلوب");
      }
      if (value.length > 500) {
        throw new Error("نص الاستعلام طويل جدًا (الحد الأقصى 500 حرف)");
      }
      return true;
    },
  },
};
