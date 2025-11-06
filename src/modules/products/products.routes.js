// ==========================================
// products.routes.js (FIXED)
// ==========================================

import { ProductsController } from "./products.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export async function productsRoutes(fastify, options) {
  const controller = new ProductsController(fastify.prisma);

  /**
   * @route GET /api/products
   * @desc Get all products with filters
   * @access Private (All authenticated users)
   */
  fastify.get("/", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get all products with optional filters",
      tags: ["Products"],
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
            enum: ["name", "price", "stock", "category", "createdAt"],
            default: "createdAt",
          },
          sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
      },
    },
    handler: controller.getAllProducts,
  });

  /**
   * @route GET /api/products/search
   * @desc Search products
   * @access Private (All authenticated users)
   */
  fastify.get("/search", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Search products by name or category",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        required: ["q"],
        properties: {
          q: { type: "string", minLength: 2 },
        },
      },
    },
    handler: controller.searchProducts,
  });

  /**
   * @route GET /api/products/stats
   * @desc Get products statistics
   * @access Private (Admin, Manager)
   */
  fastify.get("/stats", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Get products statistics",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
    },
    handler: controller.getProductsStats,
  });

  /**
   * @route GET /api/products/low-stock-count
   * @desc Get low stock products count
   * @access Private (Admin, Manager)
   */
  fastify.get("/low-stock-count", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Get count of products with low stock",
      tags: ["Products"],
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
   * @route GET /api/products/supplier/:supplierId
   * @desc Get products by supplier
   * @access Private (All authenticated users)
   */
  fastify.get("/supplier/:supplierId", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get all products from a specific supplier",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["supplierId"],
        properties: {
          supplierId: { type: "number" },
        },
      },
    },
    handler: controller.getProductsBySupplierId,
  });

  /**
   * @route GET /api/products/:id/with-accessories
   * @desc Get product with full accessories details
   * @access Private (All authenticated users)
   */
  fastify.get("/:id/with-accessories", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get product with complete accessories information",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
    },
    handler: controller.getProductWithAccessories,
  });

  /**
   * @route GET /api/products/:id
   * @desc Get product by ID
   * @access Private (All authenticated users)
   */
  fastify.get("/:id", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get a single product by ID",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
    },
    handler: controller.getProductById,
  });

  /**
   * @route POST /api/products
   * @desc Create new product
   * @access Private (Admin, Manager)
   */
  fastify.post("/", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Create a new product",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["name", "category", "price", "supplierId"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 255 },
          category: { type: "string", minLength: 2, maxLength: 100 },
          price: { type: "number", minimum: 0 },
          stock: { type: "number", minimum: 0, default: 0 },
          supplierId: { type: "number" },
          companyId: { type: "number" },
          relatedAccessories: {
            type: "array",
            items: { type: "number" },
          },
        },
      },
    },
    handler: controller.createProduct,
  });

  /**
   * @route POST /api/products/bulk-update-stock
   * @desc Bulk update stock
   * @access Private (Admin, Manager)
   */
  fastify.post("/bulk-update-stock", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Bulk update stock for multiple products",
      tags: ["Products"],
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
   * @route PUT /api/products/:id
   * @desc Update product
   * @access Private (Admin, Manager)
   */
  fastify.put("/:id", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "developer"])],
    schema: {
      description: "Update an existing product",
      tags: ["Products"],
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
          relatedAccessories: {
            type: "array",
            items: { type: "number" },
          },
        },
      },
    },
    handler: controller.updateProduct,
  });

  /**
   * @route PATCH /api/products/:id/stock
   * @desc Update product stock
   * @access Private (Admin, Manager, Employee)
   */
  fastify.patch("/:id/stock", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "manager", "employee", "developer"])],
    schema: {
      description: "Update product stock quantity",
      tags: ["Products"],
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
    handler: controller.updateProductStock,
  });

  /**
   * @route DELETE /api/products/:id
   * @desc Delete product
   * @access Private (Admin)
   */
  fastify.delete("/:id", {
    preHandler: [authenticate, checkCompanyAccess(), authorize(["admin", "developer"])],
    schema: {
      description: "Delete a product",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
    },
    handler: controller.deleteProduct,
  });
}