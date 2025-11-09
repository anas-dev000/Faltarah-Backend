// ==========================================
// maintenances.routes
// ==========================================

import * as maintenanceController from "./maintenances.controller.js";
import * as maintenanceService from "./maintenances.service.js";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  bulkUpdateStatusSchema,
  updateCustomerStatusSchema,
  reactivateCustomersSchema,
} from "./maintenances.schema.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

const validateBody = (schema) => {
  return async (request, reply) => {
    const validation = validateSchema(request.body, schema);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "خطأ في التحقق",
        details: validation.errors,
      });
    }
  };
};

export default async function maintenanceRoutes(fastify) {
  // ========================================
  // Protected Routes - All authenticated users
  // ========================================

  /**
   * @route GET /api/maintenances
   * @desc Get all maintenances with filters
   * maintenanceStatuses CustomerMaintenanceStatus[] 
   */
  fastify.get("/", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: maintenanceController.getAll,
  });

  /**
   * @route GET /api/maintenances/:id
   * @desc Get maintenance by ID
   */
  fastify.get("/:id", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: maintenanceController.getById,
  });

  /**
   * @route GET /api/maintenances/customer/:customerId
   * @desc Get maintenances by customer
   */
  fastify.get("/customer/:customerId", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: maintenanceController.getByCustomer,
  });

  // ========================================
  // Protected Routes - Manager and Developer only
  // ========================================

  /**
   * @route GET /api/maintenances/stats/overview
   * @desc Get maintenance statistics
   */
  fastify.get("/stats/overview", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.getStats,
  });

  /**
   * @route GET /api/maintenances/stats/upcoming
   * @desc Get upcoming maintenances
   */
  fastify.get("/stats/upcoming", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.getUpcoming,
  });

  /**
   * @route GET /api/maintenances/stats/overdue
   * @desc Get overdue maintenances
   */
  fastify.get("/stats/overdue", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.getOverdue,
  });

  /**
   * @route GET /api/maintenances/customers/inactive
   * @desc Get inactive customers
   */
  fastify.get("/customers/inactive", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.getInactiveCustomers,
  });

  /**
   * @route POST /api/maintenances
   * @desc Create new maintenance
   */
  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(createMaintenanceSchema),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.create,
  });

  /**
   * @route PATCH /api/maintenances/bulk/status
   * @desc Bulk update maintenance status
   */
  fastify.patch("/bulk/status", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(bulkUpdateStatusSchema),
    ],
    handler: maintenanceController.bulkUpdateStatus,
  });

  /**
   * @route PATCH /api/maintenances/customers/status
   * @desc Update customer maintenance status (Active/Inactive)
   * maintenanceStatuses CustomerMaintenanceStatus[] Update customer maintenance status
   */
  fastify.patch("/customers/status", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(updateCustomerStatusSchema),
    ],
    handler: maintenanceController.updateCustomerStatus,
  });

  /**
   * @route PATCH /api/maintenances/customers/reactivate
   * @desc maintenanceStatuses CustomerMaintenanceStatus[] Reactivate customers
   */
  fastify.patch("/customers/reactivate", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(reactivateCustomersSchema),
    ],
    handler: async (request, reply) => {
      const currentUser = request.user;
      const { customerIds, notes } = request.body;

      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: "معرفات العملاء يجب أن تكون مصفوفة غير فارغة",
        });
      }

      try {
        const result = await maintenanceService.reactivateCustomers(
          request.server.prisma,
          customerIds,
          currentUser
        );

        return reply.send({
          success: true,
          message: `تم إعادة تفعيل ${result.updated} عميل(عملاء) بنجاح`,
          data: result,
        });
      } catch (error) {
        return reply.status(error.statusCode || 500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route PUT /api/maintenances/:id
   * @desc Update maintenance
   */
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(updateMaintenanceSchema),
      checkCompanyAccess(),
    ],
    handler: maintenanceController.update,
  });

  // ========================================
  // Protected Routes - Developer only
  // ========================================

  /**
   * @route DELETE /api/maintenances/:id
   * @desc Delete maintenance
   */
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["developer"])],
    handler: maintenanceController.deleteById,
  });
}
