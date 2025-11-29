// ==========================================
// maintenances.service.js
// ==========================================

import * as maintenanceRepo from "./maintenances.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Get all maintenances with filters
 */
export const getAllMaintenances = async (prisma, currentUser, filters) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  await maintenanceRepo.autoMarkOverdue(prisma, targetCompanyId);

  const updatedFilters = { ...filters };

  return maintenanceRepo.findAll(prisma, targetCompanyId, updatedFilters);
};

/**
 * Get maintenance by ID
 */
export const getMaintenanceById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  const maintenance = await maintenanceRepo.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!maintenance) {
    throw new AppError("الصيانة غير موجودة أو لا توجد صلاحية للوصول", 404);
  }

  return maintenance;
};

/**
 * Get maintenance statistics
 */
export const getMaintenanceStats = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  await maintenanceRepo.autoMarkOverdue(prisma, targetCompanyId);

  return maintenanceRepo.getStats(prisma, targetCompanyId);
};

/**
 * Get upcoming maintenances
 */
export const getUpcomingMaintenances = async (prisma, currentUser, days) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return maintenanceRepo.getUpcoming(prisma, targetCompanyId, days);
};

/**
 * Get overdue maintenances
 */
export const getOverdueMaintenances = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  await maintenanceRepo.autoMarkOverdue(prisma, targetCompanyId);

  return maintenanceRepo.getOverdue(prisma, targetCompanyId);
};

/**
 * Create new maintenance
 */
export const createMaintenance = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم إنشاء صيانات", 403);
  }

  let targetCompanyId;
  if (role === "developer") {
    if (!data.companyId) {
      throw new AppError("معرف الشركة مطلوب للمطورين", 400);
    }
    targetCompanyId = data.companyId;
  } else {
    targetCompanyId = companyId;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      companyId: targetCompanyId,
    },
  });

  if (!customer) {
    throw new AppError("العميل غير موجود أو لا ينتمي لشركتك", 404);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: data.serviceId,
      companyId: targetCompanyId,
    },
  });

  if (!service) {
    throw new AppError("الخدمة غير موجودة أو لا تنتمي لشركتك", 404);
  }

  const product = await prisma.product.findFirst({
    where: {
      id: data.productId,
      companyId: targetCompanyId,
    },
  });

  if (!product) {
    throw new AppError("المنتج غير موجود أو لا ينتمي لشركتك", 404);
  }

  const technician = await prisma.employee.findFirst({
    where: {
      id: data.technicianId,
      companyId: targetCompanyId,
      role: "Technician",
      isEmployed: true,
    },
  });

  if (!technician) {
    throw new AppError("الفني غير موجود أو لم يعد موظفاً لديك", 404);
  }

  const maintenanceData = {
    customerId: data.customerId,
    serviceId: data.serviceId,
    productId: data.productId,
    technicianId: data.technicianId,
    companyId: targetCompanyId,
    maintenanceDate: data.maintenanceDate,
    price: data.price,
    status: data.status || "Pending",
    notes: data.notes || null,
  };

  return maintenanceRepo.create(prisma, maintenanceData);
};

/**
 * Update maintenance
 */
export const updateMaintenance = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم تحديث الصيانات", 403);
  }

  const targetCompanyId = role === "developer" ? null : companyId;
  const existingMaintenance = await maintenanceRepo.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!existingMaintenance) {
    throw new AppError("الصيانة غير موجودة أو لا توجد صلاحية للوصول", 404);
  }

  if (role === "manager" && existingMaintenance.companyId !== companyId) {
    throw new AppError("يمكنك فقط تحديث الصيانات في شركتك", 403);
  }

  if (data.customerId && data.customerId !== existingMaintenance.customerId) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        companyId: existingMaintenance.companyId,
      },
    });

    if (!customer) {
      throw new AppError("العميل غير موجود أو لا توجد صلاحية", 404);
    }
  }

  if (data.serviceId && data.serviceId !== existingMaintenance.serviceId) {
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        companyId: existingMaintenance.companyId,
      },
    });

    if (!service) {
      throw new AppError("الخدمة غير موجودة أو لا توجد صلاحية", 404);
    }
  }

  if (data.productId && data.productId !== existingMaintenance.productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        companyId: existingMaintenance.companyId,
      },
    });

    if (!product) {
      throw new AppError("المنتج غير موجود أو لا توجد صلاحية", 404);
    }
  }

  if (
    data.technicianId &&
    data.technicianId !== existingMaintenance.technicianId
  ) {
    const technician = await prisma.employee.findFirst({
      where: {
        id: data.technicianId,
        companyId: existingMaintenance.companyId,
        role: "Technician",
        isEmployed: true,
      },
    });

    if (!technician) {
      throw new AppError("الفني غير موجود أو لا توجد صلاحية", 404);
    }
  }

  return maintenanceRepo.update(prisma, id, data);
};

/**
 * Bulk update maintenance status
 */
export const bulkUpdateMaintenanceStatus = async (
  prisma,
  maintenanceIds,
  status,
  currentUser
) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم تحديث الصيانات", 403);
  }

  const targetCompanyId = role === "developer" ? null : companyId;

  const maintenances = await prisma.maintenance.findMany({
    where: {
      id: { in: maintenanceIds },
      ...(targetCompanyId && { companyId: targetCompanyId }),
    },
    select: { id: true },
  });

  if (maintenances.length !== maintenanceIds.length) {
    throw new AppError("بعض الصيانات غير موجودة أو لا توجد صلاحية", 404);
  }

  const result = await maintenanceRepo.bulkUpdateStatus(
    prisma,
    maintenanceIds,
    status
  );

  return {
    updated: result.count,
    status,
  };
};

/**
 *  Delete maintenance (simple - no cascading needed)
 */
export const deleteMaintenance = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can delete
  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم حذف الصيانات", 403);
  }

  const maintenance = await maintenanceRepo.findById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!maintenance) {
    throw new AppError("الصيانة غير موجودة أو لا توجد صلاحية", 404);
  }

  // Manager can only delete maintenances in their company
  if (role === "manager" && maintenance.companyId !== companyId) {
    throw new AppError("يمكنك فقط حذف الصيانات في شركتك", 403);
  }

  //  Delete maintenance (no cascading needed - maintenance is a leaf entity)
  await maintenanceRepo.deleteById(prisma, id);

  return { success: true };
};

/**
 * Get maintenances by customer
 */
export const getMaintenancesByCustomer = async (
  prisma,
  customerId,
  currentUser
) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      ...(targetCompanyId && { companyId: targetCompanyId }),
    },
  });

  if (!customer) {
    throw new AppError("العميل غير موجود أو لا توجد صلاحية", 404);
  }

  return maintenanceRepo.findByCustomer(prisma, customerId, targetCompanyId);
};

/**
 * Update customer status (Active/Inactive)
 */
export const updateCustomerMaintenanceStatus = async (
  prisma,
  customerIds,
  status,
  reason,
  notes,
  currentUser
) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم تحديث حالة العملاء", 403);
  }

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    throw new AppError("معرفات العملاء غير صالحة", 400);
  }

  if (!["Active", "Inactive"].includes(status)) {
    throw new AppError("الحالة يجب أن تكون Active أو Inactive", 400);
  }

  const targetCompanyId = role === "developer" ? null : companyId;

  const customers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds },
      ...(targetCompanyId && { companyId: targetCompanyId }),
    },
    select: { id: true, companyId: true },
  });

  if (customers.length !== customerIds.length) {
    throw new AppError("بعض العملاء غير موجودين أو لا توجد صلاحية", 404);
  }

  const statusRecords = [];

  for (const customer of customers) {
    const existingStatus = await prisma.customerMaintenanceStatus.findFirst({
      where: {
        customerId: customer.id,
        companyId: customer.companyId,
      },
      orderBy: { statusChangedAt: "desc" },
    });

    if (existingStatus) {
      const updated = await prisma.customerMaintenanceStatus.update({
        where: { id: existingStatus.id },
        data: {
          status,
          inactiveReason: status === "Inactive" ? reason : null,
          notes: notes || null,
          statusChangedAt: new Date(),
        },
      });
      statusRecords.push(updated);
    } else {
      const created = await prisma.customerMaintenanceStatus.create({
        data: {
          customerId: customer.id,
          companyId: customer.companyId,
          status,
          inactiveReason: status === "Inactive" ? reason : null,
          notes: notes || null,
        },
      });
      statusRecords.push(created);
    }
  }

  return {
    updated: statusRecords.length,
    status,
    customerIds,
  };
};

/**
 * Reactivate customers (Inactive to Active)
 */
export const reactivateCustomers = async (prisma, customerIds, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("الموظفون لا يمكنهم إعادة تفعيل العملاء", 403);
  }

  const targetCompanyId = role === "developer" ? null : companyId;

  const customers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds },
      ...(targetCompanyId && { companyId: targetCompanyId }),
    },
    select: { id: true, companyId: true },
  });

  if (customers.length !== customerIds.length) {
    throw new AppError("بعض العملاء غير موجودين أو لا توجد صلاحية", 404);
  }

  const statusRecords = [];

  for (const customer of customers) {
    const existingStatus = await prisma.customerMaintenanceStatus.findFirst({
      where: {
        customerId: customer.id,
        companyId: customer.companyId,
      },
      orderBy: { statusChangedAt: "desc" },
    });

    if (existingStatus) {
      const updated = await prisma.customerMaintenanceStatus.update({
        where: { id: existingStatus.id },
        data: {
          status: "Active",
          inactiveReason: null,
          statusChangedAt: new Date(),
        },
      });
      statusRecords.push(updated);
    } else {
      const created = await prisma.customerMaintenanceStatus.create({
        data: {
          customerId: customer.id,
          companyId: customer.companyId,
          status: "Active",
        },
      });
      statusRecords.push(created);
    }
  }

  return {
    updated: statusRecords.length,
    status: "Active",
    customerIds,
  };
};

/**
 * Get inactive customers
 */
export const getInactiveCustomers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return maintenanceRepo.getInactiveCustomers(prisma, targetCompanyId);
};
