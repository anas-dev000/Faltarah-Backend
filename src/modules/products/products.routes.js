// ==========================================
// products.routes.js
// ==========================================

import * as productsController from "./products.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export default async function productsRoutes(fastify, options) {
  // =====================================================
  // Products Routes
  // =====================================================

  /**
   * @route GET /api/products
   * @desc Get all products with filters
   * @access Private (All authenticated users)
   */
  fastify.get("/", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: productsController.getAllProducts,
  });

  /**
   * @route GET /api/products/search
   * @desc Search products by name
   * @access Private (All authenticated users)
   */
  fastify.get("/search", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: productsController.searchProducts,
  });

  /**
   * @route GET /api/products/categories
   * @desc Get all unique categories
   * @access Private (All authenticated users)
   */
  fastify.get("/categories", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: productsController.getCategories,
  });

  /**
   * @route GET /api/products/stats
   * @desc Get products statistics
   * @access Private (Manager, Developer)
   */
  fastify.get("/stats", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.getProductsStats,
  });

  /**
   * @route GET /api/products/low-stock
   * @desc Get low stock products
   * @access Private (Manager, Developer)
   */
  fastify.get("/low-stock", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.getLowStockProducts,
  });

  /**
   * @route GET /api/products/:id
   * @desc Get product by ID
   * @access Private (All authenticated users)
   */
  fastify.get("/:id", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: productsController.getProductById,
  });

  /**
   * @route POST /api/products
   * @desc Create new product
   * @access Private (Manager, Developer)
   */
  fastify.post("/", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.createProduct,
  });

  /**
   * @route PUT /api/products/:id
   * @desc Update product
   * @access Private (Manager, Developer)
   */
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.updateProduct,
  });

  /**
   * @route PATCH /api/products/:id/stock
   * @desc Update product stock only
   * @access Private (Manager, Developer)
   */
  fastify.patch("/:id/stock", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.updateProductStock,
  });

  /**
   * @route DELETE /api/products/:id
   * @desc Delete product
   * @access Private (Developer and Manager only)
   */
  fastify.delete("/:id", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: productsController.deleteProduct,
  });
}
