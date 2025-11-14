import {
  getAllPayments,
  getPaymentById,
  getPaymentsByInstallmentId,
  countPendingPayments,
  countOverduePayments,
  createPayment,
  updatePayment,
  deletePayment,
  getInstallmentSummary,
} from "./installmentPayments.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

/**
 * Installment Payments Routes
 * الأقساط الشهرية والدفعات
 *
 * هذا الموديول منفصل لتنظيم أفضل
 */
export default async function installmentPaymentsRoutes(fastify, options) {
  // ==============================================
  // GET ROUTES - استرجاع البيانات
  // ==============================================

  /**
   * GET /api/installment-payments
   * الحصول على جميع الدفعات (مع فلترة اختيارية)
   */
  fastify.get(
    "/",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all installment payments with optional filters",
        tags: ["Installment Payments"],
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["Paid", "Partial", "Pending"],
              description: "Filter by payment status",
            },
            customerId: {
              type: "integer",
              description: "Filter by customer ID",
            },
            installmentId: {
              type: "integer",
              description: "Filter by installment ID",
            },
          },
        },
        response: {
          200: {
            description: "List of installment payments",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
            },
          },
        },
      },
    },
    getAllPayments
  );

  /**
   * ⭐ NEW ROUTE: GET /api/installment-payments/installment/:installmentId
   * الحصول على جميع أقساط فاتورة معينة
   */
  fastify.get(
    "/installment/:installmentId",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all payments for a specific installment",
        tags: ["Installment Payments"],
        params: {
          type: "object",
          required: ["installmentId"],
          properties: {
            installmentId: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            description: "List of payments for the installment",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array" },
              count: { type: "number" },
            },
          },
        },
      },
    },
    getPaymentsByInstallmentId
  );

  /**
   * GET /api/installment-payments/:id
   * الحصول على دفعة معينة بالتفاصيل
   */
  fastify.get(
    "/:id",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get payment details by ID",
        tags: ["Installment Payments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getPaymentById
  );

  /**
   * GET /api/installment-payments/stats/pending-count
   * عدد الدفعات المعلقة
   */
  fastify.get(
    "/stats/pending-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count pending installment payments",
        tags: ["Installment Payments - Statistics"],
      },
    },
    countPendingPayments
  );

  /**
   * GET /api/installment-payments/stats/overdue-count
   * عدد الدفعات المتأخرة
   */
  fastify.get(
    "/stats/overdue-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count overdue installment payments",
        tags: ["Installment Payments - Statistics"],
      },
    },
    countOverduePayments
  );

  /**
   * GET /api/installment-payments/summary/:installmentId
   * ملخص حالة أقساط خطة معينة
   */
  fastify.get(
    "/summary/:installmentId",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get installment payment summary",
        tags: ["Installment Payments - Summary"],
        params: {
          type: "object",
          required: ["installmentId"],
          properties: {
            installmentId: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getInstallmentSummary
  );

  // ==============================================
  // POST ROUTE - إنشاء دفعة (القسط الأول فقط)
  // ==============================================

  /**
   * POST /api/installment-payments
   * إنشاء أول دفعة للقسط
   *
   * بعد هذه الدفعة، يتم إنشاء الأقساط التالية تلقائياً عند التحديث
   */
  fastify.post(
    "/",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description:
          "Create first installment payment for a new installment plan",
        tags: ["Installment Payments"],
        body: {
          type: "object",
          required: ["installmentId", "customerId", "amountDue", "dueDate"],
          properties: {
            installmentId: {
              type: "integer",
              minimum: 1,
              description: "ID of the installment plan",
            },
            customerId: {
              type: "integer",
              minimum: 1,
              description: "ID of the customer",
            },
            amountDue: {
              type: "number",
              minimum: 0,
              description: "Amount due for this payment",
            },
            amountPaid: {
              type: "number",
              minimum: 0,
              default: 0,
              description: "Amount paid (optional)",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "Payment due date",
            },
            paymentDate: {
              type: "string",
              format: "date-time",
              description: "Payment actual date (optional)",
            },
            notes: {
              type: "string",
              maxLength: 500,
              description: "Additional notes",
            },
          },
        },
        response: {
          201: {
            description: "Payment created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    createPayment
  );

  // ==============================================
  // PUT ROUTE - تحديث دفعة (معالجة الدفع)
  // ==============================================

  /**
   * PUT /api/installment-payments/:id
   * تحديث دفعة موجودة بمبلغ جديد
   *
   * هذه العملية:
   * 1. تغلق القسط الحالي
   * 2. تنشئ قسط جديد تلقائياً
   * 3. ترحل الأرصدة تلقائياً
   */
  fastify.put(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description:
          "Update payment with new amount. This will close current payment and create next one automatically",
        tags: ["Installment Payments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
        body: {
          type: "object",
          properties: {
            amountPaid: {
              type: "number",
              minimum: 0,
              description: "Amount to pay. Cannot exceed amountDue",
            },
            notes: {
              type: "string",
              maxLength: 500,
              description: "Update notes",
            },
          },
          required: ["amountPaid"],
        },
        response: {
          200: {
            description: "Payment updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              data: { type: "object" },
            },
          },
        },
      },
    },
    updatePayment
  );

  // ==============================================
  // DELETE ROUTE - حذف دفعة (للمطورين فقط)
  // ==============================================

  /**
   * DELETE /api/installment-payments/:id
   * حذف دفعة (للمطورين فقط)
   *
   * لا يمكن حذف:
   * - دفعة مدفوعة (Paid)
   * - دفعة مدفوعة جزئياً (Partial)
   *
   * يمكن حذف فقط دفعة معلقة (Pending) لم يتم الدفع عليها
   */
  fastify.delete(
    "/:id",
    {
      preHandler: [authenticate, authorize(["developer"])],
      schema: {
        description:
          "Delete installment payment (Developer only). Can only delete Pending payments",
        tags: ["Installment Payments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: {
            description: "Payment deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    deletePayment
  );
}
