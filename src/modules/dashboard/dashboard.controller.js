// ==========================================
// dashboard.controller.js - ENHANCED VERSION
// ==========================================

import * as dashboardService from "./dashboard.service.js";

/**
 * Sales Overview Dashboard
 * @route GET /api/dashboard/sales-overview
 */
export const getSalesOverview = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {
      startDate: request.query.startDate,
      endDate: request.query.endDate,
      period: request.query.period || "month",
    };

    const data = await dashboardService.getSalesOverview(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Products Performance Dashboard
 * @route GET /api/dashboard/products-performance
 */
export const getProductsPerformance = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {
      startDate: request.query.startDate,
      endDate: request.query.endDate,
      category: request.query.category,
    };

    const data = await dashboardService.getProductsPerformance(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Customers Insights Dashboard
 * @route GET /api/dashboard/customers-insights
 */
export const getCustomersInsights = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {};

    const data = await dashboardService.getCustomersInsights(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Maintenance Tracking Dashboard
 * @route GET /api/dashboard/maintenance-tracking
 */
export const getMaintenanceTracking = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {
      startDate: request.query.startDate,
      endDate: request.query.endDate,
    };

    const data = await dashboardService.getMaintenanceTracking(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Installments Dashboard
 * @route GET /api/dashboard/installments
 */
export const getInstallmentsDashboard = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {
      startDate: request.query.startDate,
      endDate: request.query.endDate,
    };

    const data = await dashboardService.getInstallmentsDashboard(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Employees Performance Dashboard
 * @route GET /api/dashboard/employees-performance
 */
export const getEmployeesPerformance = async (request, reply) => {
  try {
    const currentUser = request.user;
    const filters = {
      startDate: request.query.startDate,
      endDate: request.query.endDate,
    };

    const data = await dashboardService.getEmployeesPerformance(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Executive Summary Dashboard (Main Overview)
 * @route GET /api/dashboard/executive-summary
 */
export const getExecutiveSummary = async (request, reply) => {
  try {
    const currentUser = request.user;

    const data = await dashboardService.getExecutiveSummary(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// dashboard.routes.js - ENHANCED VERSION
// ==========================================

import * as dashboardController from "./dashboard.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export default async function dashboardRoutes(fastify, options) {
  /**
   * @route GET /api/dashboard/executive-summary
   * @desc Get Executive Summary (Main Overview for Managers)
   * @access Manager, Developer
   */
  fastify.get("/executive-summary", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Executive Summary Dashboard",
      tags: ["Dashboard"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
          },
        },
      },
    },
    handler: dashboardController.getExecutiveSummary,
  });

  /**
   * @route GET /api/dashboard/sales-overview
   * @desc Get Sales Overview Dashboard
   * @access Manager, Developer
   */
  fastify.get("/sales-overview", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Sales Overview Dashboard",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          period: { type: "string", enum: ["day", "week", "month", "year"] },
        },
      },
    },
    handler: dashboardController.getSalesOverview,
  });

  /**
   * @route GET /api/dashboard/products-performance
   * @desc Get Products Performance Dashboard
   * @access Manager, Developer
   */
  fastify.get("/products-performance", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Products Performance Dashboard",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          category: { type: "string" },
        },
      },
    },
    handler: dashboardController.getProductsPerformance,
  });

  /**
   * @route GET /api/dashboard/customers-insights
   * @desc Get Customers Insights Dashboard
   * @access Manager, Developer
   */
  fastify.get("/customers-insights", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Customers Insights Dashboard",
      tags: ["Dashboard"],
    },
    handler: dashboardController.getCustomersInsights,
  });

  /**
   * @route GET /api/dashboard/maintenance-tracking
   * @desc Get Maintenance Tracking Dashboard
   * @access Manager, Developer
   */
  fastify.get("/maintenance-tracking", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Maintenance Tracking Dashboard",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
    },
    handler: dashboardController.getMaintenanceTracking,
  });

  /**
   * @route GET /api/dashboard/installments
   * @desc Get Installments Dashboard
   * @access Manager, Developer
   */
  fastify.get("/installments", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Installments Dashboard",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
    },
    handler: dashboardController.getInstallmentsDashboard,
  });

  /**
   * @route GET /api/dashboard/employees-performance
   * @desc Get Employees Performance Dashboard
   * @access Manager, Developer
   */
  fastify.get("/employees-performance", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get Employees Performance Dashboard",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
    },
    handler: dashboardController.getEmployeesPerformance,
  });

  // ========================================
  // LEGACY ROUTES (Backward Compatibility)
  // ========================================

  /**
   * @route GET /api/dashboard/stats
   * @desc Get basic dashboard statistics (legacy)
   * @access All authenticated users
   */
  fastify.get("/stats", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: async (request, reply) => {
      const currentUser = request.user;
      const { role, companyId } = currentUser;

      const targetCompanyId = role === "developer" ? null : companyId;

      const [
        totalCustomers,
        pendingInstallments,
        upcomingMaintenances,
        lowStockProducts,
        monthlyRevenue,
        overduePayments,
      ] = await Promise.all([
        request.server.prisma.customer.count({
          where: targetCompanyId ? { companyId: targetCompanyId } : {},
        }),
        request.server.prisma.installmentPayment.count({
          where: {
            status: { in: ["Pending", "Partial"] },
            installment: targetCompanyId
              ? { invoice: { companyId: targetCompanyId } }
              : {},
          },
        }),
        request.server.prisma.maintenance.count({
          where: {
            status: "Pending",
            maintenanceDate: {
              gte: new Date(),
              lte: (() => {
                const date = new Date();
                date.setDate(date.getDate() + 30);
                return date;
              })(),
            },
            ...(targetCompanyId && { companyId: targetCompanyId }),
          },
        }),
        request.server.prisma.product.count({
          where: {
            stock: { lte: 10 },
            ...(targetCompanyId && { companyId: targetCompanyId }),
          },
        }),
        (async () => {
          const firstDayOfMonth = new Date();
          firstDayOfMonth.setDate(1);
          firstDayOfMonth.setHours(0, 0, 0, 0);

          const result = await request.server.prisma.invoice.aggregate({
            where: {
              contractDate: { gte: firstDayOfMonth },
              ...(targetCompanyId && { companyId: targetCompanyId }),
            },
            _sum: { totalAmount: true },
          });

          return Number(result._sum.totalAmount || 0);
        })(),
        request.server.prisma.installmentPayment.count({
          where: {
            status: { in: ["Pending", "Partial"] },
            dueDate: { lt: new Date() },
            installment: targetCompanyId
              ? { invoice: { companyId: targetCompanyId } }
              : {},
          },
        }),
      ]);

      return reply.send({
        success: true,
        data: {
          totalCustomers,
          pendingInstallments,
          upcomingMaintenances,
          lowStockProducts,
          monthlyRevenue,
          overduePayments,
        },
      });
    },
  });
}
