// src/modules/aiQuery/aiQuery.repository.js
// ==========================================
// AI Query Repository - Data Access Layer (FIXED: Relations with Connect)
// ==========================================

import { Prisma } from "@prisma/client";

/**
 * حفظ استعلام في السجل
 */
export const createQueryHistory = async (prisma, data) => {
  // Ensure companyId is properly set (handle null/undefined)
  const safeCompanyId = data.companyId ? data.companyId : null;

  console.log(
    "safeCompanyId = data.companyId ? data.companyId : null;  result => ",
    safeCompanyId
  );

  return prisma.aIQueryHistory.create({
    data: {
      user: { connect: { id: data.userId } },
      ...(safeCompanyId && { company: { connect: { id: safeCompanyId } } }),
      queryText: data.queryText,
      queryType: data.queryType,
      results: Prisma.JsonNull ? null : data.results || [],
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
  // Handle null companyId in where clause
  const where =
    role === "developer"
      ? {}
      : {
          userId,
          ...(companyId && { companyId }),
        };

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

/**
 * استعلامات العملاء
 */
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

/**
 * استعلامات الموظفين
 */
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

/**
 * استعلامات المنتجات
 */
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
    orderBy: { id: "desc" },
    take: 100,
  });
};

/**
 * استعلامات الملحقات
 */
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
    orderBy: { id: "desc" },
    take: 100,
  });
};

/**
 * استعلامات الفواتير (FIXED: Always include companyId filter if available)
 */
export const queryInvoices = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && companyId && { companyId }), // Only add if companyId exists
    ...(filters.saleType && { saleType: filters.saleType }),
  };

  // فلترة حسب المبلغ
  if (filters.totalAmountGte || filters.totalAmountLte) {
    where.totalAmount = {};
    if (filters.totalAmountGte) {
      where.totalAmount.gte = parseFloat(filters.totalAmountGte);
    }
    if (filters.totalAmountLte) {
      where.totalAmount.lte = parseFloat(filters.totalAmountLte);
    }
  }

  // Date filter ONLY if year/month explicitly provided
  if (filters.year) {
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year, 11, 31, 23, 59, 59);
    where.contractDate = {
      gte: startDate,
      lte: endDate,
    };
  } else if (filters.month) {
    const now = new Date();
    const year = filters.year || now.getFullYear();
    const startDate = new Date(year, filters.month - 1, 1);
    const endDate = new Date(year, filters.month, 0, 23, 59, 59);
    where.contractDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Debug where clause
  console.log(`🔍 Invoice where clause:`, JSON.stringify(where, null, 2));

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

/**
 * استعلامات الأقساط
 */
export const queryInstallments = async (prisma, filters, companyId, role) => {
  let where = {};

  // البحث عن الأقساط بناءً على حالتها
  if (filters.status === "Overdue") {
    // الأقساط المتأخرة: تاريخ استحقاق قديم و حالة غير مدفوعة
    where = {
      AND: [
        {
          dueDate: {
            lt: new Date(),
          },
        },
        {
          status: {
            in: ["Pending", "Partial"],
          },
        },
      ],
    };
  } else if (filters.status) {
    where.status = filters.status;
  }

  // فلترة حسب الشهر الحالي إن كان موجود
  if (filters.currentMonth) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    where.dueDate = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  // الربط مع الشركة - Only if companyId exists
  if (role !== "developer" && companyId) {
    where.installment = {
      invoice: {
        companyId,
      },
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

/**
 * استعلامات الصيانة
 */
export const queryMaintenance = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && companyId && { companyId }),
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

/**
 * استعلامات الموردين
 */
export const querySuppliers = async (prisma, filters, companyId, role) => {
  const where = {
    ...(role !== "developer" && companyId && { companyId }),
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
