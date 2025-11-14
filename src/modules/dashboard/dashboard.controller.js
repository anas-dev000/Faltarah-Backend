// ==========================================
// dashboard.controller.js
// ==========================================

import * as dashboardService from "./dashboard.service.js";

/**
 * Get all dashboard statistics
 * @route GET /api/dashboard/stats
 */
export const getDashboardStats = async (request, reply) => {
  const currentUser = request.user;

  const stats = await dashboardService.getDashboardStats(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: stats,
  });
};

/**
 * Get total customers count
 * @route GET /api/customers/count
 */
export const getTotalCustomers = async (request, reply) => {
  const currentUser = request.user;

  const count = await dashboardService.getTotalCustomers(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { count },
  });
};

/**
 * Get pending installments count
 * @route GET /api/installments/pending-count
 */
export const getPendingInstallments = async (request, reply) => {
  const currentUser = request.user;

  const count = await dashboardService.getPendingInstallments(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { count },
  });
};

/**
 * Get upcoming maintenances count
 * @route GET /api/maintenances/upcoming-count
 */
export const getUpcomingMaintenances = async (request, reply) => {
  const currentUser = request.user;

  const count = await dashboardService.getUpcomingMaintenances(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { count },
  });
};

/**
 * Get low stock products count
 * @route GET /api/products/low-stock-count
 */
export const getLowStockProducts = async (request, reply) => {
  const currentUser = request.user;

  const count = await dashboardService.getLowStockProducts(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { count },
  });
};

/**
 * Get monthly revenue
 * @route GET /api/invoices/monthly-revenue
 */
export const getMonthlyRevenue = async (request, reply) => {
  const currentUser = request.user;

  const revenue = await dashboardService.getMonthlyRevenue(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { revenue },
  });
};

/**
 * Get overdue payments count
 * @route GET /api/payments/overdue-count
 */
export const getOverduePayments = async (request, reply) => {
  const currentUser = request.user;

  const count = await dashboardService.getOverduePayments(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { count },
  });
};

/**
 * Get recent invoices
 * @route GET /api/invoices/recent
 */
export const getRecentInvoices = async (request, reply) => {
  const currentUser = request.user;

  const invoices = await dashboardService.getRecentInvoices(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: invoices,
    count: invoices.length,
  });
};

/**
 * Get upcoming maintenances list
 * @route GET /api/maintenances/upcoming-list
 */
export const getUpcomingMaintenancesList = async (request, reply) => {
  const currentUser = request.user;

  const maintenances = await dashboardService.getUpcomingMaintenancesList(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: maintenances,
    count: maintenances.length,
  });
};