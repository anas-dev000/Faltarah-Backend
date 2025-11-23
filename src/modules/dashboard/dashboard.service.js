// ==========================================
// dashboard.service.js - ENHANCED VERSION
// ==========================================

import * as dashboardRepository from "./dashboard.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * ========================================
 * 1) SALES OVERVIEW DASHBOARD
 * ========================================
 */
export const getSalesOverview = async (prisma, currentUser, filters = {}) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const { startDate, endDate, period = "month" } = filters;

  // Monthly Revenue Trend (Line Chart)
  const monthlyRevenue = await dashboardRepository.getMonthlyRevenueTrend(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Sales by Sales Rep (Bar Chart)
  const salesBySalesRep = await dashboardRepository.getSalesBySalesRep(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Sales Type Distribution (Pie Chart)
  const salesTypeDistribution =
    await dashboardRepository.getSalesTypeDistribution(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  // KPI Cards
  const kpis = await dashboardRepository.getSalesKPIs(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  return {
    monthlyRevenue,
    salesBySalesRep,
    salesTypeDistribution,
    kpis,
  };
};

/**
 * ========================================
 * 2) PRODUCTS PERFORMANCE DASHBOARD
 * ========================================
 */
export const getProductsPerformance = async (
  prisma,
  currentUser,
  filters = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const { startDate, endDate, category } = filters;

  // Top Selling Products (Bar Chart)
  const topProducts = await dashboardRepository.getTopSellingProducts(
    prisma,
    targetCompanyId,
    startDate,
    endDate,
    10
  );

  // Sales by Category (Donut Chart)
  const categoryDistribution = await dashboardRepository.getSalesByCategory(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Low Stock Alerts
  const lowStockProducts = await dashboardRepository.getLowStockAlerts(
    prisma,
    targetCompanyId,
    10
  );

  // Category Performance Heatmap
  const categoryHeatmap =
    await dashboardRepository.getCategoryMonthlyPerformance(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  return {
    topProducts,
    categoryDistribution,
    lowStockProducts,
    categoryHeatmap,
  };
};

/**
 * ========================================
 * 3) CUSTOMERS INSIGHTS DASHBOARD
 * ========================================
 */
export const getCustomersInsights = async (
  prisma,
  currentUser,
  filters = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  // Customer Distribution by City
  const customersByCity = await dashboardRepository.getCustomersByCity(
    prisma,
    targetCompanyId
  );

  // Customer Type Distribution
  const customerTypeDistribution =
    await dashboardRepository.getCustomerTypeDistribution(
      prisma,
      targetCompanyId
    );

  // Top Spending Customers
  const topCustomers = await dashboardRepository.getTopSpendingCustomers(
    prisma,
    targetCompanyId,
    10
  );

  // Customer Growth Trend
  const customerGrowth = await dashboardRepository.getCustomerGrowthTrend(
    prisma,
    targetCompanyId,
    12
  );

  return {
    customersByCity,
    customerTypeDistribution,
    topCustomers,
    customerGrowth,
  };
};

/**
 * ========================================
 * 4) MAINTENANCE TRACKING DASHBOARD
 * ========================================
 */
export const getMaintenanceTracking = async (
  prisma,
  currentUser,
  filters = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const { startDate, endDate } = filters;

  // Maintenance Status Distribution
  const statusDistribution =
    await dashboardRepository.getMaintenanceStatusDistribution(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  // Upcoming Maintenances (Timeline)
  const upcomingMaintenances =
    await dashboardRepository.getUpcomingMaintenances(
      prisma,
      targetCompanyId,
      30
    );

  // Maintenance by Technician
  const technicianPerformance =
    await dashboardRepository.getMaintenanceByTechnician(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  // Overdue Maintenances Alert
  const overdueMaintenances = await dashboardRepository.getOverdueMaintenances(
    prisma,
    targetCompanyId
  );

  return {
    statusDistribution,
    upcomingMaintenances,
    technicianPerformance,
    overdueMaintenances,
  };
};

/**
 * ========================================
 * 5) INSTALLMENTS DASHBOARD
 * ========================================
 */
export const getInstallmentsDashboard = async (
  prisma,
  currentUser,
  filters = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const { startDate, endDate } = filters;

  // Monthly Collection Trend (Line Chart)
  const monthlyCollection = await dashboardRepository.getMonthlyCollectionTrend(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Payment Status Distribution (Stacked Bar)
  const paymentStatusDistribution =
    await dashboardRepository.getPaymentStatusDistribution(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  // Collection Rate (Gauge Chart)
  const collectionRate = await dashboardRepository.getCollectionRate(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Top Delayed Customers (Table)
  const delayedCustomers = await dashboardRepository.getTopDelayedCustomers(
    prisma,
    targetCompanyId,
    10
  );

  return {
    monthlyCollection,
    paymentStatusDistribution,
    collectionRate,
    delayedCustomers,
  };
};

/**
 * ========================================
 * 6) EMPLOYEES PERFORMANCE DASHBOARD
 * ========================================
 */
export const getEmployeesPerformance = async (
  prisma,
  currentUser,
  filters = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const { startDate, endDate } = filters;

  // Top Sales Reps Leaderboard
  const salesLeaderboard = await dashboardRepository.getSalesLeaderboard(
    prisma,
    targetCompanyId,
    startDate,
    endDate
  );

  // Technician Efficiency
  const technicianEfficiency =
    await dashboardRepository.getTechnicianEfficiency(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  // Installations by Technician
  const installationsByTechnician =
    await dashboardRepository.getInstallationsByTechnician(
      prisma,
      targetCompanyId,
      startDate,
      endDate
    );

  return {
    salesLeaderboard,
    technicianEfficiency,
    installationsByTechnician,
  };
};

/**
 * ========================================
 * 7) EXECUTIVE SUMMARY (للمدير)
 * ========================================
 */
export const getExecutiveSummary = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  // Current Month vs Last Month Comparison
  const [currentStats, lastMonthStats] = await Promise.all([
    dashboardRepository.getMonthStats(prisma, targetCompanyId, currentMonth),
    dashboardRepository.getMonthStats(prisma, targetCompanyId, lastMonth),
  ]);

  const comparison = {
    revenue: {
      current: currentStats.revenue,
      previous: lastMonthStats.revenue,
      change: calculatePercentageChange(
        currentStats.revenue,
        lastMonthStats.revenue
      ),
    },
    invoices: {
      current: currentStats.invoiceCount,
      previous: lastMonthStats.invoiceCount,
      change: calculatePercentageChange(
        currentStats.invoiceCount,
        lastMonthStats.invoiceCount
      ),
    },
    customers: {
      current: currentStats.customerCount,
      previous: lastMonthStats.customerCount,
      change: calculatePercentageChange(
        currentStats.customerCount,
        lastMonthStats.customerCount
      ),
    },
    maintenances: {
      current: currentStats.maintenanceCount,
      previous: lastMonthStats.maintenanceCount,
      change: calculatePercentageChange(
        currentStats.maintenanceCount,
        lastMonthStats.maintenanceCount
      ),
    },
  };

  // Critical Alerts
  const alerts = await dashboardRepository.getCriticalAlerts(
    prisma,
    targetCompanyId
  );

  // Top Performers
  const topPerformers = await dashboardRepository.getTopPerformers(
    prisma,
    targetCompanyId
  );

  return {
    comparison,
    alerts,
    topPerformers,
  };
};

/**
 * Helper: Calculate percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export default {
  getSalesOverview,
  getProductsPerformance,
  getCustomersInsights,
  getMaintenanceTracking,
  getInstallmentsDashboard,
  getEmployeesPerformance,
  getExecutiveSummary,
};
