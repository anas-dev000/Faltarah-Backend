import {
  getAllInvoices,
  getInvoiceById,
  getRecentInvoices,
  getMonthlyRevenue,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceItems,
  createInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  getAllInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  getAllInstallmentPayments,
  countPendingPayments,
  countOverduePayments,
  createInstallmentPayment,
  updateInstallmentPayment,
  deleteInstallmentPayment,
} from "./invoices.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

/**
 * Invoices Routes
 * Handles all invoice-related endpoints with role-based access control
 */
export default async function invoicesRoutes(fastify, options) {
  // ==============================================
  // INVOICES ROUTES
  // ==============================================

  // GET /api/invoices - Get all invoices
  fastify.get(
    "/",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all invoices with optional filters",
        tags: ["Invoices"],
        querystring: {
          type: "object",
          properties: {
            saleType: {
              type: "string",
              enum: ["Cash", "Installment"],
              description: "Filter by sale type",
            },
            dateFrom: {
              type: "string",
              format: "date",
              description: "Filter from date",
            },
            dateTo: {
              type: "string",
              format: "date",
              description: "Filter to date",
            },
            customerId: {
              type: "integer",
              description: "Filter by customer ID",
            },
          },
        },
      },
    },
    getAllInvoices
  );

  // GET /api/invoices/recent - Get recent invoices
  fastify.get(
    "/recent",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get recent invoices",
        tags: ["Invoices"],
        querystring: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 5,
            },
          },
        },
      },
    },
    getRecentInvoices
  );

  // GET /api/invoices/monthly-revenue - Get monthly revenue
  fastify.get(
    "/monthly-revenue",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get monthly revenue",
        tags: ["Invoices"],
      },
    },
    getMonthlyRevenue
  );

  // GET /api/invoices/:id - Get invoice by ID
  fastify.get(
    "/:id",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get invoice by ID",
        tags: ["Invoices"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getInvoiceById
  );

  // POST /api/invoices - Create new invoice
  fastify.post(
    "/",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create new invoice (Manager, Developer only)",
        tags: ["Invoices"],
        body: {
          type: "object",
          required: [
            "customerId",
            "salesRepId",
            "totalAmount",
            "saleType",
            "contractDate",
          ],
          properties: {
            customerId: { type: "integer", minimum: 1 },
            salesRepId: { type: "integer", minimum: 1 },
            technicianId: { type: "integer", minimum: 1 },
            totalAmount: { type: "number", minimum: 0 },
            discountAmount: { type: "number", minimum: 0 },
            saleType: { type: "string", enum: ["Cash", "Installment"] },
            maintenancePeriod: { type: "integer", minimum: 0 },
            paidAtContract: { type: "number", minimum: 0 },
            paidAtInstallation: { type: "number", minimum: 0 },
            installationCostType: {
              type: "string",
              enum: ["Percentage", "Fixed"],
            },
            installationCostValue: { type: "number", minimum: 0 },
            contractDate: { type: "string", format: "date-time" },
            installationDate: { type: "string", format: "date-time" },
            contractNotes: { type: "string" },
            companyId: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    createInvoice
  );

  // PUT /api/invoices/:id - Update invoice
  fastify.put(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update invoice (Manager, Developer only)",
        tags: ["Invoices"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    updateInvoice
  );

  // DELETE /api/invoices/:id - Delete invoice
  fastify.delete(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Delete invoice (Manager, Developer only)",
        tags: ["Invoices"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    deleteInvoice
  );

  // ==============================================
  // INVOICE ITEMS ROUTES
  // ==============================================

  // GET /api/invoices/:invoiceId/items - Get invoice items
  fastify.get(
    "/:invoiceId/items",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get invoice items",
        tags: ["Invoice Items"],
        params: {
          type: "object",
          required: ["invoiceId"],
          properties: {
            invoiceId: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getInvoiceItems
  );

  // POST /api/invoices/items - Create invoice item
  fastify.post(
    "/items",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create invoice item",
        tags: ["Invoice Items"],
      },
    },
    createInvoiceItem
  );

  // PUT /api/invoices/items/:id - Update invoice item
  fastify.put(
    "/items/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update invoice item",
        tags: ["Invoice Items"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    updateInvoiceItem
  );

  // DELETE /api/invoices/items/:id - Delete invoice item
  fastify.delete(
    "/items/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Delete invoice item",
        tags: ["Invoice Items"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    deleteInvoiceItem
  );

  // ==============================================
  // INSTALLMENTS ROUTES
  // ==============================================

  // GET /api/invoices/installments - Get all installments
  fastify.get(
    "/installments",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all installments",
        tags: ["Installments"],
      },
    },
    getAllInstallments
  );

  // GET /api/invoices/installments/:id - Get installment by ID
  fastify.get(
    "/installments/:id",
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

  // POST /api/invoices/installments - Create installment
  fastify.post(
    "/installments",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create installment",
        tags: ["Installments"],
      },
    },
    createInstallment
  );

  // PUT /api/invoices/installments/:id - Update installment
  fastify.put(
    "/installments/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update installment",
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
    updateInstallment
  );

  // DELETE /api/invoices/installments/:id - Delete installment
  fastify.delete(
    "/installments/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Delete installment",
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

  // GET /api/invoices/installment-payments - Get all installment payments
  fastify.get(
    "/installment-payments",
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
            },
            customerId: { type: "integer" },
          },
        },
      },
    },
    getAllInstallmentPayments
  );

  // GET /api/invoices/installment-payments/pending-count
  fastify.get(
    "/installment-payments/pending-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count pending installment payments",
        tags: ["Installment Payments"],
      },
    },
    countPendingPayments
  );

  // GET /api/invoices/installment-payments/overdue-count
  fastify.get(
    "/installment-payments/overdue-count",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Count overdue installment payments",
        tags: ["Installment Payments"],
      },
    },
    countOverduePayments
  );

  // POST /api/invoices/installment-payments - Create installment payment
  fastify.post(
    "/installment-payments",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create installment payment",
        tags: ["Installment Payments"],
      },
    },
    createInstallmentPayment
  );

  // PUT /api/invoices/installment-payments/:id - Update installment payment
  fastify.put(
    "/installment-payments/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update installment payment",
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
    updateInstallmentPayment
  );

  // DELETE /api/invoices/installment-payments/:id - Delete installment payment
  fastify.delete(
    "/installment-payments/:id",
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
    deleteInstallmentPayment
  );
}