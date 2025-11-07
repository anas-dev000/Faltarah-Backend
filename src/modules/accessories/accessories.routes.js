// ==========================================
// accessories.routes.js
// ==========================================

import * as accessoriesController from "./accessories.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export default async function accessoriesRoutes(fastify, options) {
  // =====================================================
  // Accessories Routes
  // =====================================================

  /**
   * @route GET /api/accessories
   * @desc Get all accessories with filters
   * @access Private (All authenticated users)
   */
  fastify.get("/", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: accessoriesController.getAllAccessories,
  });

  /**
   * @route GET /api/accessories/search
   * @desc Search accessories by name
   * @access Private (All authenticated users)
   */
  fastify.get("/search", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: accessoriesController.searchAccessories,
  });

  /**
   * @route GET /api/accessories/stats
   * @desc Get accessories statistics
   * @access Private (Manager, Developer)
   */
  fastify.get("/stats", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.getAccessoriesStats,
  });

  /**
   * @route GET /api/accessories/low-stock
   * @desc Get low stock accessories
   * @access Private (Manager, Developer)
   */
  fastify.get("/low-stock", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.getLowStockAccessories,
  });

  /**
   * @route GET /api/accessories/:id
   * @desc Get accessory by ID
   * @access Private (All authenticated users)
   */
  fastify.get("/:id", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: accessoriesController.getAccessoryById,
  });

  /**
   * @route POST /api/accessories
   * @desc Create new accessory
   * @access Private (Manager, Developer)
   */
  fastify.post("/", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.createAccessory,
  });

  /**
   * @route PUT /api/accessories/:id
   * @desc Update accessory
   * @access Private (Manager, Developer)
   */
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.updateAccessory,
  });

  /**
   * @route PATCH /api/accessories/:id/stock
   * @desc Update accessory stock only
   * @access Private (Manager, Developer)
   */
  fastify.patch("/:id/stock", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.updateAccessoryStock,
  });

  /**
   * @route DELETE /api/accessories/:id
   * @desc Delete accessory
   * @access Private (Developer only)
   */
  fastify.delete("/:id", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: accessoriesController.deleteAccessory,
  });
}
