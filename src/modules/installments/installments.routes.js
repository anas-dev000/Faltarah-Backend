import {
  getAllInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
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
      description: "Get all installments with pagination",
      tags: ["Installments"],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          description: "Installments list retrieved successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
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
}