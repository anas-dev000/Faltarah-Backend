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
      description: "Get all invoices with optional filters and pagination",
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
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Page number",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
            description: "Items per page",
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
}