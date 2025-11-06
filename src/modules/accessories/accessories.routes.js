// ==========================================
// accessories.routes.js (FIXED)
// ==========================================

import { AccessoriesController } from "./accessories.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export async function accessoriesRoutes(fastify, options) {
  const controller = new AccessoriesController(fastify.prisma);

  /**
   * @route GET /api/accessories
   * @desc Get all accessories with filters
   * @access Private (All authenticated users)
   */
  fastify.get("/", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get all accessories with optional filters",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          category: { type: "string" },
          supplierId: { type: "number" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          lowStock: { type: "boolean" },
          stockThreshold: { type: "number" },
          page: { type: "number", minimum: 1, default: 1 },
          limit: { type: "number", minimum: 1, maximum: 100, default: 50 },
          sortBy: {
            type: "string",
            enum: ["name", "price", "stock", "createdAt"],
            default: "createdAt",
          },
          sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
      },
    },
    handler: controller.getAllAccessories,
  });

  /**
   * @route GET /api/accessories/search
   * @desc Search accessories
   * @access Private (All authenticated users)
   */
  fastify.get("/search", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Search accessories by name",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        required: ["q"],
        properties: {
          q: { type: "string", minLength: 2 },
        },
      },
    },
    handler: controller.searchAccessories,
  });

  /**
   * @route GET /api/accessories/stats
   * @desc Get accessories statistics
   * @access Private (Admin, Manager)
   */
  fastify.get("/stats", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Get accessories statistics",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
    },
    handler: controller.getAccessoriesStats,
  });

  /**
   * @route GET /api/accessories/low-stock-count
   * @desc Get low stock accessories count
   * @access Private (Admin, Manager)
   */
  fastify.get("/low-stock-count", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Get count of accessories with low stock",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          threshold: { type: "number", minimum: 1, default: 10 },
        },
      },
    },
    handler: controller.getLowStockCount,
  });

  /**
   * @route GET /api/accessories/supplier/:supplierId
   * @desc Get accessories by supplier
   * @access Private (All authenticated users)
   */
  fastify.get("/supplier/:supplierId", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get all accessories from a specific supplier",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["supplierId"],
        properties: {
          supplierId: { type: "number" },
        },
      },
    },
    handler: controller.getAccessoriesBySupplierId,
  });

  /**
   * @route GET /api/accessories/:id
   * @desc Get accessory by ID
   * @access Private (All authenticated users)
   */
  fastify.get("/:id", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get a single accessory by ID",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
    },
    handler: controller.getAccessoryById,
  });

  /**
   * @route POST /api/accessories
   * @desc Create new accessory
   * @access Private (Admin, Manager)
   */
  fastify.post("/", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Create a new accessory",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["name", "price", "supplierId"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 255 },
          category: { type: "string", minLength: 2, maxLength: 100 },
          price: { type: "number", minimum: 0 },
          stock: { type: "number", minimum: 0, default: 0 },
          supplierId: { type: "number" },
          companyId: { type: "number" },
        },
      },
    },
    handler: controller.createAccessory,
  });

  /**
   * @route POST /api/accessories/bulk-update-stock
   * @desc Bulk update stock
   * @access Private (Admin, Manager)
   */
  fastify.post("/bulk-update-stock", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Bulk update stock for multiple accessories",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["updates"],
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "stock"],
              properties: {
                id: { type: "number" },
                stock: { type: "number" },
                operation: { type: "string", enum: ["set", "add", "subtract"] },
              },
            },
          },
        },
      },
    },
    handler: controller.bulkUpdateStock,
  });

  /**
   * @route PUT /api/accessories/:id
   * @desc Update accessory
   * @access Private (Admin, Manager)
   */
  fastify.put("/:id", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Update an existing accessory",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 255 },
          category: { type: "string", minLength: 2, maxLength: 100 },
          price: { type: "number", minimum: 0 },
          stock: { type: "number", minimum: 0 },
          supplierId: { type: "number" },
        },
      },
    },
    handler: controller.updateAccessory,
  });

  /**
   * @route PATCH /api/accessories/:id/stock
   * @desc Update accessory stock
   * @access Private (Admin, Manager, Employee)
   */
  fastify.patch("/:id/stock", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "employee", "developer"])],
    schema: {
      description: "Update accessory stock quantity",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
      body: {
        type: "object",
        required: ["stock"],
        properties: {
          stock: { type: "number", minimum: 0 },
          operation: {
            type: "string",
            enum: ["set", "add", "subtract"],
            default: "set",
          },
        },
      },
    },
    handler: controller.updateAccessoryStock,
  });

  /**
   * @route DELETE /api/accessories/:id
   * @desc Delete accessory
   * @access Private (Admin)
   */
  fastify.delete("/:id", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "developer"])],
    schema: {
      description: "Delete an accessory",
      tags: ["Accessories"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
    },
    handler: controller.deleteAccessory,
  });
}