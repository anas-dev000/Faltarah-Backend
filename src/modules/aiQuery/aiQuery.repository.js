// ==========================================
// aiQuery.repository.js
// Database queries for AI Smart Query
// ==========================================

/**
 * حفظ استعلام في السجل
 */
export const createQueryHistory = async (prisma, data) => {
  return prisma.aIQueryHistory.create({
    data: {
      userId: data.userId,
      companyId: data.companyId,
      queryText: data.queryText,
      queryType: data.queryType,
      results: data.results || [],
      resultCount: data.resultCount || 0,
      status: data.status || "success",
      errorMessage: data.errorMessage,
      executionTime: data.executionTime,
    },
  });
};

/**
 * جلب سجل الاستعلامات
 */
export const getQueryHistory = async (
  prisma,
  userId,
  companyId,
  role,
  limit = 10
) => {
  const where = role === "developer" ? {} : { companyId, userId };

  return prisma.aIQueryHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      queryText: true,
      queryType: true,
      resultCount: true,
      status: true,
      executionTime: true,
      createdAt: true,
    },
  });
};

// ==========================================
// استعلامات العملاء
// ==========================================
export const queryCustomers = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.customerType && { customerType: filters.customerType }),
    ...(filters.governorate && { governorate: filters.governorate }),
    ...(filters.city && { city: filters.city }),
  };

  return prisma.customer.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      customerType: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الموظفين
// ==========================================
export const queryEmployees = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.role && { role: filters.role }),
    ...(filters.city && { city: filters.city }),
    ...(filters.isEmployed !== undefined && {
      isEmployed: filters.isEmployed,
    }),
  };

  return prisma.employee.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      role: true,
      primaryNumber: true,
      city: true,
      district: true,
      governorate: true,
      isEmployed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات المنتجات
// ==========================================
export const queryProducts = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.category && { category: filters.category }),
    ...(filters.priceGte && { price: { gte: filters.priceGte } }),
    ...(filters.priceLte && { price: { lte: filters.priceLte } }),
    ...(filters.stock !== undefined && { stock: filters.stock }),
    ...(filters.stockLow && { stock: { lt: 10 } }),
  };

  return prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      stock: true,
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الملحقات
// ==========================================
export const queryAccessories = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.priceGte && { price: { gte: filters.priceGte } }),
    ...(filters.priceLte && { price: { lte: filters.priceLte } }),
    ...(filters.stock !== undefined && { stock: filters.stock }),
    ...(filters.stockLow && { stock: { lt: 20 } }),
  };

  return prisma.accessory.findMany({
    where,
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الفواتير
// ==========================================
export const queryInvoices = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.saleType && { saleType: filters.saleType }),
  };

  // فلترة حسب التاريخ
  if (filters.month || filters.year) {
    const year = filters.year || new Date().getFullYear();
    const month = filters.month || 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    where.contractDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  return prisma.invoice.findMany({
    where,
    select: {
      id: true,
      totalAmount: true,
      saleType: true,
      contractDate: true,
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      salesRep: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { contractDate: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الأقساط
// ==========================================
export const queryInstallments = async (prisma, filters, companyId, role) => {
  const where = {
    installment: {
      invoice: {
        ...(role !== "developer" && { companyId }),
      },
    },
  };

  // حالة القسط
  if (filters.status === "Overdue") {
    where.status = { in: ["Pending", "Partial"] };
    where.dueDate = { lt: new Date() };
  } else if (filters.status) {
    where.status = filters.status;
  }

  // الشهر الحالي
  if (filters.currentMonth) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    where.dueDate = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  return prisma.installmentPayment.findMany({
    where,
    select: {
      id: true,
      amountDue: true,
      amountPaid: true,
      status: true,
      dueDate: true,
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الصيانة
// ==========================================
export const queryMaintenance = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
    ...(filters.status && { status: filters.status }),
  };

  return prisma.maintenance.findMany({
    where,
    select: {
      id: true,
      maintenanceDate: true,
      price: true,
      status: true,
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
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { maintenanceDate: "desc" },
    take: 100,
  });
};

// ==========================================
// استعلامات الموردين
// ==========================================
export const querySuppliers = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && { companyId }),
  };

  return prisma.supplier.findMany({
    where,
    select: {
      id: true,
      name: true,
      contactInfo: true,
      _count: {
        select: {
          products: true,
          accessories: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
};
