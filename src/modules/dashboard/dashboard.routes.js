// ==========================================
// dashboard.routes.js - UPDATED VERSION
// ==========================================

import * as dashboardController from "./dashboard.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export default async function dashboardRoutes(fastify, options) {
  // =====================================================
  // LEGACY ROUTES (for backward compatibility)
  // =====================================================

  /**
   * @route GET /api/dashboard/stats
   * @desc Get all dashboard statistics in one call
   * @access Private (All authenticated users)
   */
  fastify.get("/stats", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get comprehensive dashboard statistics",
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
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const [
          totalCustomers,
          pendingInstallments,
          upcomingMaintenances,
          lowStockItems,
          lowStockAccessories,
          monthlyRevenue,
          overduePayments,
        ] = await Promise.all([
          request.server.prisma.customer.count({
            where: targetCompanyId ? { companyId: targetCompanyId } : {},
          }),

          request.server.prisma.installmentPayment.count({
            where: {
              status: { in: ["Pending", "Partial"] },
              ...(targetCompanyId && {
                installment: { invoice: { companyId: targetCompanyId } },
              }),
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

          request.server.prisma.accessory.count({
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
              ...(targetCompanyId && {
                installment: { invoice: { companyId: targetCompanyId } },
              }),
            },
          }),
        ]);

        return reply.send({
          success: true,
          data: {
            totalCustomers,
            pendingInstallments,
            upcomingMaintenances,
            lowStockItems,
            lowStockAccessories,
            monthlyRevenue,
            overduePayments,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/invoices/recent
   * @desc Get recent invoices
   * @access Private (All authenticated users)
   */
  fastify.get("/invoices/recent", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get recent invoices",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "number", default: 5, maximum: 50 },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;
        const limit = request.query.limit || 5;

        const invoices = await request.server.prisma.invoice.findMany({
          where: targetCompanyId ? { companyId: targetCompanyId } : {},
          select: {
            id: true,
            customerId: true,
            totalAmount: true,
            saleType: true,
            contractDate: true,
          },
          orderBy: { contractDate: "desc" },
          take: limit,
        });

        return reply.send({
          success: true,
          data: invoices,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/maintenances/upcoming-list
   * @desc Get upcoming maintenances list
   * @access Private (All authenticated users)
   */
  fastify.get("/maintenances/upcoming-list", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get upcoming maintenances list",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "number", default: 10, maximum: 50 },
          days: { type: "number", default: 30, maximum: 90 },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;
        const limit = request.query.limit || 10;
        const days = request.query.days || 30;

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        const maintenances = await request.server.prisma.maintenance.findMany({
          where: {
            status: "Pending",
            maintenanceDate: {
              gte: today,
              lte: futureDate,
            },
            ...(targetCompanyId && { companyId: targetCompanyId }),
          },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { maintenanceDate: "asc" },
          take: limit,
        });

        return reply.send({
          success: true,
          data: maintenances,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/maintenances/overdue-list
   * @desc Get overdue maintenances list
   * @access Private (All authenticated users)
   */
  fastify.get("/maintenances/overdue-list", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get overdue maintenances list",
      tags: ["Dashboard"],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "number", default: 10, maximum: 50 },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;
        const limit = request.query.limit || 10;

        const today = new Date();

        const maintenances = await request.server.prisma.maintenance.findMany({
          where: {
            status: "Pending",
            maintenanceDate: { lt: today },
          },
          include: {
            customer: {
              // Fixed: lowercase 'customer'
              select: {
                fullName: true,
                primaryNumber: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            maintenanceDate: "asc",
          },
        });

        return reply.send({
          success: true,
          data: maintenances,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/installments/pending-count
   * @desc Get pending installments count
   * @access Private (Manager, Developer)
   */
  fastify.get("/installments/pending-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get pending installments count",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const count = await request.server.prisma.installmentPayment.count({
          where: {
            status: { in: ["Pending", "Partial"] },
            ...(targetCompanyId && {
              installment: { invoice: { companyId: targetCompanyId } },
            }),
          },
        });

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/maintenances/upcoming-count
   * @desc Get upcoming maintenances count
   * @access Private (All authenticated users)
   */
  fastify.get("/maintenances/upcoming-count", {
    preHandler: [authenticate, checkCompanyAccess()],
    schema: {
      description: "Get upcoming maintenances count",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const count = await request.server.prisma.maintenance.count({
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
        });

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/products/low-stock-count
   * @desc Get low stock products count
   * @access Private (Manager, Developer)
   */
  fastify.get("/products/low-stock-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get low stock products count",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const count = await request.server.prisma.product.count({
          where: {
            stock: { lte: 10 },
            ...(targetCompanyId && { companyId: targetCompanyId }),
          },
        });

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/accessories/low-stock-count
   * @desc Get low stock accessories count
   * @access Private (Manager, Developer)
   */
  fastify.get("/accessories/low-stock-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get low stock accessories count",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const count = await request.server.prisma.accessory.count({
          where: {
            stock: { lte: 10 },
            ...(targetCompanyId && { companyId: targetCompanyId }),
          },
        });

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/invoices/monthly-revenue
   * @desc Get monthly revenue
   * @access Private (Manager, Developer)
   */
  fastify.get("/invoices/monthly-revenue", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get monthly revenue",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

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

        return reply.send({
          success: true,
          data: { revenue: Number(result._sum.totalAmount || 0) },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });

  /**
   * @route GET /api/dashboard/payments/overdue-count
   * @desc Get overdue payments count
   * @access Private (Manager, Developer)
   */
  fastify.get("/payments/overdue-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    schema: {
      description: "Get overdue payments count",
      tags: ["Dashboard"],
    },
    handler: async (request, reply) => {
      try {
        const currentUser = request.user;
        const { role, companyId } = currentUser;
        const targetCompanyId = role === "developer" ? null : companyId;

        const count = await request.server.prisma.installmentPayment.count({
          where: {
            status: { in: ["Pending", "Partial"] },
            dueDate: { lt: new Date() },
            ...(targetCompanyId && {
              installment: { invoice: { companyId: targetCompanyId } },
            }),
          },
        });

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    },
  });
}
