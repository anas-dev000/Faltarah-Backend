// ==========================================
// maintenances.repository
// ==========================================

/**
 * Find all maintenances with filters - OPTIMIZED
 */
export const findAll = async (prisma, companyId, filters = {}) => {
  const { search, month, status, customerStatus, customerId } = filters;

  const whereClause = {
    ...(companyId && { companyId }),
  };

  // Filter by search term
  if (search) {
    whereClause.OR = [
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { service: { name: { contains: search, mode: "insensitive" } } },
      { technician: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // maintenanceStatuses CustomerMaintenanceStatus[] Filter by month
  if (month && month !== "all") {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    whereClause.maintenanceDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  // maintenanceStatuses CustomerMaintenanceStatus[] Filter by maintenance status
  if (status && status !== "all") {
    whereClause.status = status;
  }

  // maintenanceStatuses CustomerMaintenanceStatus[] FIXED & OPTIMIZED: Filter by customer maintenance status (Active/Inactive)
  if (customerStatus && customerStatus !== "all") {

    whereClause.customer = {
      maintenanceStatuses: {
        some: {
          status: customerStatus, // "Active" / "Inactive"
        },
      },
    };
  }

  // Filter by specific customer
  if (customerId) {
    whereClause.customerId = customerId;
  }

  // maintenanceStatuses CustomerMaintenanceStatus[] OPTIMIZED: Efficient queries with proper relations
  return prisma.maintenance.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
          governorate: true,
          city: true,
          district: true,
          customerType: true,
          // maintenanceStatuses CustomerMaintenanceStatus[] Include maintenance status
          maintenanceStatuses: {
            orderBy: { statusChangedAt: "desc" },
            take: 1,
            select: {
              status: true,
              inactiveReason: true,
              notes: true,
              statusChangedAt: true,
            },
          },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      maintenanceDate: "desc",
    },
  });
};

/**
 * Find maintenance by ID
 */
export const findById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.maintenance.findFirst({
    where: whereClause,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
          secondaryNumber: true,
          governorate: true,
          city: true,
          district: true,
          customerType: true,
          maintenanceStatuses: {
            orderBy: { statusChangedAt: "desc" },
            take: 1,
          },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
          secondaryNumber: true,
          role: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
        },
      },
    },
  });
};

/**
 * Get maintenance statistics
 */
export const getStats = async (prisma, companyId) => {
  const whereClause = companyId ? { companyId } : {};

  const [total, pending, completed, cancelled, overdue, totalRevenue] =
    await Promise.all([
      prisma.maintenance.count({ where: whereClause }),
      prisma.maintenance.count({
        where: { ...whereClause, status: "Pending" },
      }),
      prisma.maintenance.count({
        where: { ...whereClause, status: "Completed" },
      }),
      prisma.maintenance.count({
        where: { ...whereClause, status: "Cancelled" },
      }),
      prisma.maintenance.count({
        where: { ...whereClause, status: "Overdue" },
      }),
      prisma.maintenance.aggregate({
        where: { ...whereClause, status: "Completed" },
        _sum: { price: true },
      }),
    ]);

  return {
    total,
    pending,
    completed,
    cancelled,
    overdue,
    totalRevenue: totalRevenue._sum.price || 0,
    averagePrice: total > 0 ? (totalRevenue._sum.price || 0) / total : 0,
  };
};

/**
 * Get upcoming maintenances
 */
export const getUpcoming = async (prisma, companyId, days = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return prisma.maintenance.findMany({
    where: {
      ...(companyId && { companyId }),
      status: "Pending",
      maintenanceDate: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
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
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      maintenanceDate: "asc",
    },
  });
};

/**
 * Get overdue maintenances
 */
export const getOverdue = async (prisma, companyId) => {
  const today = new Date();

  return prisma.maintenance.findMany({
    where: {
      ...(companyId && { companyId }),
      status: "Pending",
      maintenanceDate: {
        lt: today,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      maintenanceDate: "asc",
    },
  });
};

/**
 * Create new maintenance record
 */
export const create = async (prisma, data) => {
  return prisma.maintenance.create({
    data: {
      ...data,
      maintenanceDate: new Date(data.maintenanceDate),
      status: data.status || "Pending",
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
};

/**
 * Update maintenance record
 */
export const update = async (prisma, id, data) => {
  const updateData = { ...data };

  if (updateData.maintenanceDate) {
    updateData.maintenanceDate = new Date(updateData.maintenanceDate);
  }

  return prisma.maintenance.update({
    where: { id },
    data: updateData,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
};

/**
 * Bulk update maintenance status
 */
export const bulkUpdateStatus = async (prisma, maintenanceIds, status) => {

  return prisma.maintenance.updateMany({
    where: {
      id: {
        in: maintenanceIds,
      },
    },
    data: {
      status,
    },
  });
};

/**
 * Delete maintenance record
 */
export const deleteById = async (prisma, id) => {
  return prisma.maintenance.delete({
    where: { id },
  });
};

/**
 * Check if maintenance exists
 */
export const exists = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  const count = await prisma.maintenance.count({
    where: whereClause,
  });

  return count > 0;
};

/**
 * Get maintenance by customer
 */
export const findByCustomer = async (prisma, customerId, companyId = null) => {
  return prisma.maintenance.findMany({
    where: {
      customerId,
      ...(companyId && { companyId }),
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      maintenanceDate: "desc",
    },
  });
};

/**
 * Auto-mark overdue maintenances
 */
export const autoMarkOverdue = async (prisma, companyId = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  return prisma.maintenance.updateMany({
    where: {
      ...(companyId && { companyId }),
      status: "Pending",
      maintenanceDate: {
        lt: today,
      },
    },
    data: {
      status: "Overdue",
    },
  });
};

/**
 * Get inactive customers using CustomerMaintenanceStatus table
 */
export const getInactiveCustomers = async (prisma, companyId) => {

  // Get customers with Inactive status from CustomerMaintenanceStatus
  const inactiveStatuses = await prisma.customerMaintenanceStatus.findMany({
    where: {
      ...(companyId && { companyId }),
      status: "Inactive",
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
          governorate: true,
          city: true,
          district: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      statusChangedAt: "desc",
    },
  });


  // Extract customer data and add status info
  return inactiveStatuses.map((status) => ({
    ...status.customer,
    inactiveReason: status.inactiveReason,
    notes: status.notes,
    statusChangedAt: status.statusChangedAt,
  }));
};

/**
 * Get active customers count
 */
export const getActiveCustomersCount = async (prisma, companyId) => {
  return prisma.customerMaintenanceStatus.count({
    where: {
      ...(companyId && { companyId }),
      status: "Active",
    },
  });
};
