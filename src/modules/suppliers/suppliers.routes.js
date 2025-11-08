import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
} from "./suppliers.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

/**
 * Suppliers Routes
 * Handles all supplier-related endpoints with role-based access control
 */
export default async function suppliersRoutes(fastify, options) {
  // GET /api/suppliers - Get all suppliers
  fastify.get(
    "/",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get all suppliers with optional filters",
        tags: ["Suppliers"],
        querystring: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Search in name or contact info",
            },
          },
        },
        response: {
          200: {
            description: "Suppliers list retrieved successfully",
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
    getAllSuppliers
  );

  // GET /api/suppliers/search - Search suppliers
  fastify.get(
    "/search",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Search suppliers by name or contact info",
        tags: ["Suppliers"],
        querystring: {
          type: "object",
          required: ["q"],
          properties: {
            q: { type: "string", minLength: 2, description: "Search query" },
          },
        },
      },
    },
    searchSuppliers
  );

  // GET /api/suppliers/:id - Get supplier by ID
  fastify.get(
    "/:id",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Get supplier by ID",
        tags: ["Suppliers"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    getSupplierById
  );

  // POST /api/suppliers - Create new supplier
  fastify.post(
    "/",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Create new supplier (Manager, Developer only)",
        tags: ["Suppliers"],
        body: {
          type: "object",
          required: ["name", "contactInfo"],
          properties: {
            name: { type: "string", minLength: 3, maxLength: 255 },
            contactInfo: { type: "string", minLength: 5 },
            companyId: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    createSupplier
  );

  // PUT /api/suppliers/:id - Update supplier
  fastify.put(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Update supplier (Manager, Developer only)",
        tags: ["Suppliers"],
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
            name: { type: "string", minLength: 3, maxLength: 255 },
            contactInfo: { type: "string", minLength: 5 },
          },
        },
      },
    },
    updateSupplier
  );

  // DELETE /api/suppliers/:id - Delete supplier
  fastify.delete(
    "/:id",
    {
      preHandler: [authenticate, authorize(["manager", "developer"])],
      schema: {
        description: "Delete supplier (Developer and Manager only)",
        tags: ["Suppliers"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    deleteSupplier
  );
}
