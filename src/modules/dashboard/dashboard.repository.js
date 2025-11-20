// ==========================================
// dashboard.repository.js
// ==========================================

/**
 * Get total customers count
 */
export const getTotalCustomersCount = async (prisma, companyId = null) => {
  const where = {};
  
  if (companyId) {
    where.companyId = companyId;
  }
  
  return await prisma.customer.count({ where });
};

/**
 * Get pending installments count
 */
export const getPendingInstallmentsCount = async (prisma, companyId = null) => {
  const where = {
    status: { in: ["Pending", "Partial"] },
  };
  
  if (companyId) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }
  
  return await prisma.installmentPayment.count({ where });
};

/**
 * Get upcoming maintenances count (next 30 days)
 */
export const getUpcomingMaintenancesCount = async (prisma, companyId = null) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const where = {
    status: "Pending",
    maintenanceDate: {
      gte: today,
      lte: thirtyDaysFromNow,
    },
  };
  
  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.maintenance.count({ where });
};

/**
 * Get low stock products count (stock <= 10)
 */
export const getLowStockProductsCount = async (prisma, companyId = null) => {
  const where = {
    stock: { lte: 10 },
  };
  
  if (companyId) {
    where.companyId = companyId;
  }
  
  return await prisma.product.count({ where });
};

export const getLowStockAccessoriesCount = async (prisma, companyId = null) => {
  const where = {
    stock: { lte: 10 },
  };
  
  if (companyId) {
    where.companyId = companyId;
  }
  
  return await prisma.accessory.count({ where });
};

/**
 * Get monthly revenue (current month)
 */
export const getMonthlyRevenue = async (prisma, companyId = null) => {
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const where = {
    contractDate: {
      gte: firstDayOfMonth,
      lte: lastDayOfMonth,
    },
  };
  
  if (companyId) {
    where.companyId = companyId;
  }

  const result = await prisma.invoice.aggregate({
    where,
    _sum: {
      totalAmount: true,
    },
  });

  return result._sum.totalAmount || 0;
};

/**
 * Get overdue payments count
 */
export const getOverduePaymentsCount = async (prisma, companyId = null) => {
  const today = new Date();

  const where = {
    status: { in: ["Pending", "Partial"] },
    dueDate: { lt: today },
  };
  
  if (companyId) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }

  return await prisma.installmentPayment.count({ where });
};

/**
 * Get recent invoices (last 5)
 */
export const getRecentInvoices = async (prisma, companyId = null) => {
  const where = {};
  
  if (companyId) {
    where.companyId = companyId;
  }
  
  return await prisma.invoice.findMany({
    where,
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          fullName: true,
          primaryNumber: true,
        },
      },
      salesRep: {
        select: {
          fullName: true,
        },
      },
    },
  });
};

/**
 * Get upcoming maintenances list (next 30 days, limit 10)
 */
export const getUpcomingMaintenancesList = async (prisma, companyId = null) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const where = {
    status: "Pending",
    maintenanceDate: {
      gte: today,
      lte: thirtyDaysFromNow,
    },
  };
  
  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.maintenance.findMany({
    where,
    take: 10,
    orderBy: { maintenanceDate: "asc" },
    include: {
      customer: {
        select: {
          fullName: true,
          primaryNumber: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      technician: {
        select: {
          fullName: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });
};