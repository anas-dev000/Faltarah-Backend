// ==========================================
// dashboard.routes.js
// ==========================================

import * as dashboardController from "./dashboard.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";

export default async function dashboardRoutes(fastify, options) {
  // =====================================================
  // Dashboard Routes
  // =====================================================

  /**
   * @route GET /api/dashboard/stats
   * @desc Get all dashboard statistics in one call
   * @access Private (All authenticated users)
   */
  fastify.get("/stats", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: dashboardController.getDashboardStats,
  });

  /**
   * @route GET /api/customers/count
   * @desc Get total customers count
   * @access Private (All authenticated users)
   */
  fastify.get("/customers/count", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: dashboardController.getTotalCustomers,
  });

  /**
   * @route GET /api/installments/pending-count
   * @desc Get pending installments count
   * @access Private (Manager, Developer)
   */
  fastify.get("/installments/pending-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: dashboardController.getPendingInstallments,
  });

  /**
   * @route GET /api/maintenances/upcoming-count
   * @desc Get upcoming maintenances count
   * @access Private (All authenticated users)
   */
  fastify.get("/maintenances/upcoming-count", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: dashboardController.getUpcomingMaintenances,
  });

  /**
   * @route GET /api/products/low-stock-count
   * @desc Get low stock products count
   * @access Private (Manager, Developer)
   */
  fastify.get("/products/low-stock-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: dashboardController.getLowStockProducts,
  });

  /**
   * @route GET /api/invoices/monthly-revenue
   * @desc Get monthly revenue
   * @access Private (Manager, Developer)
   */
  fastify.get("/invoices/monthly-revenue", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: dashboardController.getMonthlyRevenue,
  });

  /**
   * @route GET /api/payments/overdue-count
   * @desc Get overdue payments count
   * @access Private (Manager, Developer)
   */
  fastify.get("/payments/overdue-count", {
    preHandler: [
      authenticate,
      checkCompanyAccess(),
      authorize(["manager", "developer"]),
    ],
    handler: dashboardController.getOverduePayments,
  });

  /**
   * @route GET /api/invoices/recent
   * @desc Get recent invoices
   * @access Private (All authenticated users)
   */
  fastify.get("/invoices/recent", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: dashboardController.getRecentInvoices,
  });

  /**
   * @route GET /api/maintenances/upcoming-list
   * @desc Get upcoming maintenances list
   * @access Private (All authenticated users)
   */
  fastify.get("/maintenances/upcoming-list", {
    preHandler: [authenticate, checkCompanyAccess()],
    handler: dashboardController.getUpcomingMaintenancesList,
  });
}