import {
  getAllInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  getAllPayments,
  getPaymentById,
  countPendingPayments,
  countOverduePayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "./installments.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

/**
 * Installments Routes
 * Handles all installment-related endpoints with role-based access control
 */
export default async function installmentsRoutes(fastify, options) {
  // ==============================================
  // INSTALLMENTS ROUTES
  // ==============================================

  // GET /api/installments - Get all installments
  fastify.get(
    "/",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all installments",
        tags: ["Installments"],
        response: {
          200: {
            description: "Installments list retrieved successfully",
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
    getAllInstallments
  );

  // GET /api/installments/:id - Get installment by ID
  fastify.get(
    "/:id",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get installment by ID",
        tags: ["Installments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getInstallmentById
  );

  // POST /api/installments - Create new installment
  fastify.post(
    "/",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create new installment (Manager, Developer only)",
        tags: ["Installments"],
        body: {
          type: "object",
          required: [
            "invoiceId",
            "numberOfMonths",
            "monthlyInstallment",
            "collectionStartDate",
            "collectionEndDate",
          ],
          properties: {
            invoiceId: {
              type: "integer",
              minimum: 1,
              description: "Invoice ID",
            },
            numberOfMonths: {
              type: "integer",
              minimum: 1,
              maximum: 60,
              description: "Number of months for installment",
            },
            monthlyInstallment: {
              type: "number",
              minimum: 0,
              description: "Monthly installment amount",
            },
            collectionStartDate: {
              type: "string",
              format: "date-time",
              description: "Collection start date",
            },
            collectionEndDate: {
              type: "string",
              format: "date-time",
              description: "Collection end date",
            },
          },
        },
      },
    },
    createInstallment
  );

  // PUT /api/installments/:id - Update installment
  fastify.put(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update installment (Manager, Developer only)",
        tags: ["Installments"],
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
            numberOfMonths: { type: "integer", minimum: 1, maximum: 60 },
            monthlyInstallment: { type: "number", minimum: 0 },
            collectionStartDate: { type: "string", format: "date-time" },
            collectionEndDate: { type: "string", format: "date-time" },
          },
        },
      },
    },
    updateInstallment
  );

  // DELETE /api/installments/:id - Delete installment
  fastify.delete(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Delete installment (Manager, Developer only)",
        tags: ["Installments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    deleteInstallment
  );

  // ==============================================
  // INSTALLMENT PAYMENTS ROUTES
  // ==============================================

  // GET /api/installments/payments - Get all payments
  fastify.get(
    "/payments",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all installment payments",
        tags: ["Installment Payments"],
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["Paid", "Partial", "Pending", "Overdue"],
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
      },
    },
    getAllPayments
  );

  // GET /api/installments/payments/pending-count - Count pending payments
  fastify.get(
    "/payments/pending-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count pending installment payments",
        tags: ["Installment Payments"],
      },
    },
    countPendingPayments
  );

  // GET /api/installments/payments/overdue-count - Count overdue payments
  fastify.get(
    "/payments/overdue-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count overdue installment payments",
        tags: ["Installment Payments"],
      },
    },
    countOverduePayments
  );

  // GET /api/installments/payments/:id - Get payment by ID
  fastify.get(
    "/payments/:id",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get payment by ID",
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

  // POST /api/installments/payments - Create payment
  fastify.post(
    "/payments",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create installment payment (Manager, Developer only)",
        tags: ["Installment Payments"],
        body: {
          type: "object",
          required: ["installmentId", "customerId", "amountDue", "dueDate"],
          properties: {
            installmentId: { type: "integer", minimum: 1 },
            customerId: { type: "integer", minimum: 1 },
            amountDue: { type: "number", minimum: 0 },
            amountPaid: { type: "number", minimum: 0, default: 0 },
            dueDate: { type: "string", format: "date-time" },
            paymentDate: { type: "string", format: "date-time" },
            notes: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    createPayment
  );

  // PUT /api/installments/payments/:id - Update payment
  fastify.put(
    "/payments/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update installment payment (Manager, Developer only)",
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
            amountPaid: { type: "number", minimum: 0 },
            status: {
              type: "string",
              enum: ["Paid", "Partial", "Pending", "Overdue"],
            },
            paymentDate: { type: "string", format: "date-time" },
            notes: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    updatePayment
  );

  // DELETE /api/installments/payments/:id - Delete payment
  fastify.delete(
    "/payments/:id",
    {
      preHandler: [authenticate, authorize(["developer"])],
      schema: {
        description: "Delete installment payment (Developer only)",
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
    deletePayment
  );
}