// ==========================================
// maintenances.controller
// ==========================================

import * as maintenanceService from "./maintenances.service.js";

/**
 * Get all maintenances with filters
 * (Active/Inactive)
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;
  const filters = {
    search: request.query.search,
    month: request.query.month,
    status: request.query.status,
    customerStatus: request.query.customerStatus, 
    customerId: request.query.customerId
      ? Number(request.query.customerId)
      : undefined,
  };

  const maintenances = await maintenanceService.getAllMaintenances(
    request.server.prisma,
    currentUser,
    filters
  );

  return reply.send({
    success: true,
    data: maintenances,
    count: maintenances.length,
  });
};

/**
 * Get maintenance by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const maintenance = await maintenanceService.getMaintenanceById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: maintenance,
  });
};

/**
 * Get maintenance statistics
 */
export const getStats = async (request, reply) => {
  const currentUser = request.user;

  const stats = await maintenanceService.getMaintenanceStats(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: stats,
  });
};

/**
 * Get upcoming maintenances
 */
export const getUpcoming = async (request, reply) => {
  const currentUser = request.user;
  const days = request.query.days ? Number(request.query.days) : 7;

  const maintenances = await maintenanceService.getUpcomingMaintenances(
    request.server.prisma,
    currentUser,
    days
  );

  return reply.send({
    success: true,
    data: maintenances,
    count: maintenances.length,
  });
};

/**
 * Get overdue maintenances
 */
export const getOverdue = async (request, reply) => {
  const currentUser = request.user;

  const maintenances = await maintenanceService.getOverdueMaintenances(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: maintenances,
    count: maintenances.length,
  });
};

/**
 * Create new maintenance
 */
export const create = async (request, reply) => {
  const currentUser = request.user;

  const maintenance = await maintenanceService.createMaintenance(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "تم إنشاء الصيانة بنجاح",
    data: maintenance,
  });
};

/**
 * Update maintenance
 */
export const update = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const maintenance = await maintenanceService.updateMaintenance(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "تم تحديث الصيانة بنجاح",
    data: maintenance,
  });
};

/**
 * Bulk update maintenance status
 */
export const bulkUpdateStatus = async (request, reply) => {
  const currentUser = request.user;
  const { maintenanceIds, status } = request.body;

  const result = await maintenanceService.bulkUpdateMaintenanceStatus(
    request.server.prisma,
    maintenanceIds,
    status,
    currentUser
  );

  return reply.send({
    success: true,
    message: `تم تحديث ${result.updated} صيانة(صيانات) إلى ${status} بنجاح`,
    data: result,
  });
};

/**
 * Delete maintenance
 */
export const deleteById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  await maintenanceService.deleteMaintenance(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "تم حذف الصيانة بنجاح",
  });
};

/**
 * Get maintenances by customer
 */
export const getByCustomer = async (request, reply) => {
  const { customerId } = request.params;
  const currentUser = request.user;

  const maintenances = await maintenanceService.getMaintenancesByCustomer(
    request.server.prisma,
    Number(customerId),
    currentUser
  );

  return reply.send({
    success: true,
    data: maintenances,
    count: maintenances.length,
  });
};

/**
 * Update customer maintenance status (Active/Inactive)
 */
export const updateCustomerStatus = async (request, reply) => {
  const currentUser = request.user;
  const { customerIds, status, reason, notes } = request.body;

  const result = await maintenanceService.updateCustomerMaintenanceStatus(
    request.server.prisma,
    customerIds,
    status,
    reason,
    notes,
    currentUser
  );

  return reply.send({
    success: true,
    message: `تم تحديث ${result.updated} عميل(عملاء) إلى ${status} بنجاح`,
    data: result,
  });
};

/**
 * Get inactive customers
 */
export const getInactiveCustomers = async (request, reply) => {
  const currentUser = request.user;

  const customers = await maintenanceService.getInactiveCustomers(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: customers,
    count: customers.length,
  });
};
