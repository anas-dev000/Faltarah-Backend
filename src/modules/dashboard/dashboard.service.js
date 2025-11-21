// ==========================================
// dashboard.service.js
// ==========================================

import * as dashboardRepository from "./dashboard.repository.js";

/**
 * Get total customers
 */
export const getTotalCustomers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  // Developer can see all companies
  const targetCompanyId = role === "developer" ? null : companyId;
  
  return await dashboardRepository.getTotalCustomersCount(prisma, targetCompanyId);
};

/**
 * Get pending installments
 */
export const getPendingInstallments = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  return await dashboardRepository.getPendingInstallmentsCount(prisma, targetCompanyId);
};

/**
 * Get upcoming maintenances
 */
export const getUpcomingMaintenances = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  return await dashboardRepository.getUpcomingMaintenancesCount(prisma, targetCompanyId);
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  return await dashboardRepository.getLowStockProductsCount(prisma, targetCompanyId);
};

export const getLowStockAccessories = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;  
  
  return await dashboardRepository.getLowStockAccessoriesCount(prisma, targetCompanyId);
};
/**
 * Get monthly revenue
 */
export const getMonthlyRevenue = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  const revenue = await dashboardRepository.getMonthlyRevenue(prisma, targetCompanyId);
  
  return Number(revenue);
};

/**
 * Get overdue payments
 */
export const getOverduePayments = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  return await dashboardRepository.getOverduePaymentsCount(prisma, targetCompanyId);
};

/**
 * Get recent invoices
 */
export const getRecentInvoices = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  const invoices = await dashboardRepository.getRecentInvoices(prisma, targetCompanyId);
  
  return invoices.map((invoice) => ({
    id: invoice.id,
    customerName: invoice.customer.fullName,
    customerPhone: invoice.customer.primaryNumber,
    salesRep: invoice.salesRep.fullName,
    totalAmount: Number(invoice.totalAmount),
    discountAmount: Number(invoice.discountAmount),
    saleType: invoice.saleType,
    contractDate: invoice.contractDate,
    installationDate: invoice.installationDate,
    createdAt: invoice.createdAt,
    customerId: invoice.customerId,
  }));
};

/**
 * Get upcoming maintenances list
 */
export const getUpcomingMaintenancesList = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;
  
  const targetCompanyId = role === "developer" ? null : companyId;
  
  const maintenances = await dashboardRepository.getUpcomingMaintenancesList(
    prisma,
    targetCompanyId
  );
  
  return maintenances.map((maintenance) => ({
    id: maintenance.id,
    customerName: maintenance.customer.fullName,
    customerPhone: maintenance.customer.primaryNumber,
    serviceName: maintenance.service.name,
    productName: maintenance.product.name,
    technicianName: maintenance.technician.fullName,
    maintenanceDate: maintenance.maintenanceDate,
    price: Number(maintenance.price),
    status: maintenance.status,
    notes: maintenance.notes,
    customerId: maintenance.customerId,
productId: maintenance.product.id,
  }));
};

/**
 * Get all dashboard stats in one call
 */
export const getDashboardStats = async (prisma, currentUser) => {
  const [
    totalCustomers,
    pendingInstallments,
    upcomingMaintenances,
    lowStockProducts,
    monthlyRevenue,
    overduePayments,
  ] = await Promise.all([
    getTotalCustomers(prisma, currentUser),
    getPendingInstallments(prisma, currentUser),
    getUpcomingMaintenances(prisma, currentUser),
    getLowStockProducts(prisma, currentUser),
    getMonthlyRevenue(prisma, currentUser),
    getOverduePayments(prisma, currentUser),
  ]);

  return {
    totalCustomers,
    pendingInstallments,
    upcomingMaintenances,
    lowStockProducts,
    monthlyRevenue,
    overduePayments,
  };
};