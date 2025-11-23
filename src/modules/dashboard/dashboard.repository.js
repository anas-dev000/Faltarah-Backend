// ==========================================
// dashboard.repository.js - ENHANCED VERSION
// ==========================================

/**
 * ========================================
 * SALES OVERVIEW QUERIES
 * ========================================
 */

/**
 * Monthly Revenue Trend (Line Chart)
 */
export const getMonthlyRevenueTrend = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.contractDate = {};
    if (startDate) where.contractDate.gte = new Date(startDate);
    if (endDate) where.contractDate.lte = new Date(endDate);
  } else {
    // Default: Last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    where.contractDate = { gte: twelveMonthsAgo };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      contractDate: true,
      totalAmount: true,
      discountAmount: true,
    },
  });

  // Group by month
  const monthlyData = {};

  invoices.forEach((invoice) => {
    const month = `${invoice.contractDate.getFullYear()}-${String(
      invoice.contractDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        revenue: 0,
        invoiceCount: 0,
      };
    }

    monthlyData[month].revenue +=
      Number(invoice.totalAmount) - Number(invoice.discountAmount || 0);
    monthlyData[month].invoiceCount += 1;
  });

  return Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
};

/**
 * Sales by Sales Rep (Bar Chart)
 */
export const getSalesBySalesRep = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.contractDate = {};
    if (startDate) where.contractDate.gte = new Date(startDate);
    if (endDate) where.contractDate.lte = new Date(endDate);
  }

  const salesData = await prisma.invoice.groupBy({
    by: ["salesRepId"],
    where,
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get employee details
  const salesRepIds = salesData.map((item) => item.salesRepId);

  const employees = await prisma.employee.findMany({
    where: {
      id: { in: salesRepIds },
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  const employeeMap = Object.fromEntries(
    employees.map((e) => [e.id, e.fullName])
  );

  return salesData
    .map((item) => ({
      salesRepName: employeeMap[item.salesRepId] || "Unknown",
      totalRevenue: Number(item._sum.totalAmount || 0),
      invoiceCount: item._count.id,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Sales Type Distribution (Pie Chart)
 */
export const getSalesTypeDistribution = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.contractDate = {};
    if (startDate) where.contractDate.gte = new Date(startDate);
    if (endDate) where.contractDate.lte = new Date(endDate);
  }

  const distribution = await prisma.invoice.groupBy({
    by: ["saleType"],
    where,
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
  });

  return distribution.map((item) => ({
    type: item.saleType,
    typeAr: item.saleType === "Cash" ? "كاش" : "تقسيط",
    totalRevenue: Number(item._sum.totalAmount || 0),
    invoiceCount: item._count.id,
  }));
};

/**
 * Sales KPIs
 */
export const getSalesKPIs = async (prisma, companyId, startDate, endDate) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.contractDate = {};
    if (startDate) where.contractDate.gte = new Date(startDate);
    if (endDate) where.contractDate.lte = new Date(endDate);
  }

  const [totalStats, topProduct, topSalesRep] = await Promise.all([
    prisma.invoice.aggregate({
      where,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: { id: true },
    }),

    // Top selling product
    prisma.invoiceItem.groupBy({
      by: ["productId"],
      where: {
        invoice: where,
        productId: { not: null },
      },
      _sum: { subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 1,
    }),

    // Top sales rep
    prisma.invoice.groupBy({
      by: ["salesRepId"],
      where,
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 1,
    }),
  ]);

  let topProductName = null;
  if (topProduct.length > 0) {
    const product = await prisma.product.findUnique({
      where: { id: topProduct[0].productId },
      select: { name: true },
    });
    topProductName = product?.name;
  }

  let topSalesRepName = null;
  if (topSalesRep.length > 0) {
    const employee = await prisma.employee.findUnique({
      where: { id: topSalesRep[0].salesRepId },
      select: { fullName: true },
    });
    topSalesRepName = employee?.fullName;
  }

  return {
    totalRevenue: Number(totalStats._sum.totalAmount || 0),
    averageSaleValue: Number(totalStats._avg.totalAmount || 0),
    totalInvoices: totalStats._count.id,
    topProduct: topProductName,
    topSalesRep: topSalesRepName,
  };
};

/**
 * ========================================
 * PRODUCTS PERFORMANCE QUERIES
 * ========================================
 */

/**
 * Top Selling Products
 */
export const getTopSellingProducts = async (
  prisma,
  companyId,
  startDate,
  endDate,
  limit = 10
) => {
  const where = {
    invoice: {},
  };

  if (companyId) where.invoice.companyId = companyId;

  if (startDate || endDate) {
    where.invoice.contractDate = {};
    if (startDate) where.invoice.contractDate.gte = new Date(startDate);
    if (endDate) where.invoice.contractDate.lte = new Date(endDate);
  }

  where.productId = { not: null };

  const topProducts = await prisma.invoiceItem.groupBy({
    by: ["productId"],
    where,
    _sum: {
      subtotal: true,
      quantity: true,
    },
    orderBy: {
      _sum: {
        subtotal: "desc",
      },
    },
    take: limit,
  });

  const productIds = topProducts.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true },
  });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return topProducts.map((item) => ({
    productName: productMap[item.productId]?.name || "Unknown",
    category: productMap[item.productId]?.category,
    totalRevenue: Number(item._sum.subtotal || 0),
    quantitySold: item._sum.quantity,
  }));
};

/**
 * Sales by Category
 */
export const getSalesByCategory = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {
    invoice: {},
  };

  if (companyId) where.invoice.companyId = companyId;

  if (startDate || endDate) {
    where.invoice.contractDate = {};
    if (startDate) where.invoice.contractDate.gte = new Date(startDate);
    if (endDate) where.invoice.contractDate.lte = new Date(endDate);
  }

  where.productId = { not: null };

  const items = await prisma.invoiceItem.findMany({
    where,
    select: {
      subtotal: true,
      product: {
        select: {
          category: true,
        },
      },
    },
  });

  const categoryData = {};

  items.forEach((item) => {
    const category = item.product?.category || "أخرى";

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        totalRevenue: 0,
        itemCount: 0,
      };
    }

    categoryData[category].totalRevenue += Number(item.subtotal);
    categoryData[category].itemCount += 1;
  });

  return Object.values(categoryData).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );
};

/**
 * Low Stock Alerts
 */
export const getLowStockAlerts = async (prisma, companyId, threshold = 10) => {
  const where = {
    stock: { lte: threshold },
  };

  if (companyId) where.companyId = companyId;

  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      category: true,
      stock: true,
      price: true,
    },
    orderBy: {
      stock: "asc",
    },
  });
};

/**
 * Category Monthly Performance (Heatmap)
 */
export const getCategoryMonthlyPerformance = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {
    invoice: {},
  };

  if (companyId) where.invoice.companyId = companyId;

  if (startDate || endDate) {
    where.invoice.contractDate = {};
    if (startDate) where.invoice.contractDate.gte = new Date(startDate);
    if (endDate) where.invoice.contractDate.lte = new Date(endDate);
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    where.invoice.contractDate = { gte: sixMonthsAgo };
  }

  where.productId = { not: null };

  const items = await prisma.invoiceItem.findMany({
    where,
    select: {
      subtotal: true,
      product: {
        select: {
          category: true,
        },
      },
      invoice: {
        select: {
          contractDate: true,
        },
      },
    },
  });

  const heatmapData = {};

  items.forEach((item) => {
    const category = item.product?.category || "أخرى";
    const month = `${item.invoice.contractDate.getFullYear()}-${String(
      item.invoice.contractDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const key = `${category}_${month}`;

    if (!heatmapData[key]) {
      heatmapData[key] = {
        category,
        month,
        revenue: 0,
      };
    }

    heatmapData[key].revenue += Number(item.subtotal);
  });

  return Object.values(heatmapData);
};

/**
 * ========================================
 * CUSTOMERS INSIGHTS QUERIES
 * ========================================
 */

/**
 * Customers by City
 */
export const getCustomersByCity = async (prisma, companyId) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  const distribution = await prisma.customer.groupBy({
    by: ["city", "governorate"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 15,
  });

  return distribution.map((item) => ({
    city: item.city,
    governorate: item.governorate,
    customerCount: item._count.id,
  }));
};

/**
 * Customer Type Distribution
 */
export const getCustomerTypeDistribution = async (prisma, companyId) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  const distribution = await prisma.customer.groupBy({
    by: ["customerType"],
    where,
    _count: { id: true },
  });

  return distribution.map((item) => ({
    type: item.customerType,
    typeAr: item.customerType === "Installation" ? "تركيب" : "صيانة",
    customerCount: item._count.id,
  }));
};

/**
 * Top Spending Customers
 */
export const getTopSpendingCustomers = async (
  prisma,
  companyId,
  limit = 10
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  const topCustomers = await prisma.invoice.groupBy({
    by: ["customerId"],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  const customerIds = topCustomers.map((item) => item.customerId);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, fullName: true, primaryNumber: true },
  });

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  return topCustomers.map((item) => ({
    customerName: customerMap[item.customerId]?.fullName || "Unknown",
    customerPhone: customerMap[item.customerId]?.primaryNumber,
    totalSpent: Number(item._sum.totalAmount || 0),
    invoiceCount: item._count.id,
  }));
};

/**
 * Customer Growth Trend
 */
export const getCustomerGrowthTrend = async (
  prisma,
  companyId,
  months = 12
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  where.createdAt = { gte: startDate };

  const customers = await prisma.customer.findMany({
    where,
    select: { createdAt: true },
  });

  const monthlyData = {};

  customers.forEach((customer) => {
    const month = `${customer.createdAt.getFullYear()}-${String(
      customer.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyData[month]) {
      monthlyData[month] = { month, newCustomers: 0 };
    }

    monthlyData[month].newCustomers += 1;
  });

  return Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
};

/**
 * ========================================
 * MAINTENANCE TRACKING QUERIES
 * ========================================
 */

/**
 * Maintenance Status Distribution
 */
export const getMaintenanceStatusDistribution = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.maintenanceDate = {};
    if (startDate) where.maintenanceDate.gte = new Date(startDate);
    if (endDate) where.maintenanceDate.lte = new Date(endDate);
  }

  const distribution = await prisma.maintenance.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
  });

  const statusMap = {
    Pending: "معلق",
    Completed: "مكتمل",
    Cancelled: "ملغي",
    Overdue: "متأخر",
  };

  return distribution.map((item) => ({
    status: item.status,
    statusAr: statusMap[item.status] || item.status,
    count: item._count.id,
  }));
};

/**
 * Upcoming Maintenances
 */
export const getUpcomingMaintenances = async (prisma, companyId, days = 30) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const where = {
    status: "Pending",
    maintenanceDate: {
      gte: today,
      lte: futureDate,
    },
  };

  if (companyId) where.companyId = companyId;

  return await prisma.maintenance.findMany({
    where,
    select: {
      id: true,
      maintenanceDate: true,
      price: true,
      customer: {
        select: {
          fullName: true,
          primaryNumber: true,
        },
      },
      technician: {
        select: {
          fullName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { maintenanceDate: "asc" },
    take: 20,
  });
};

/**
 * Maintenance by Technician
 */
export const getMaintenanceByTechnician = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.maintenanceDate = {};
    if (startDate) where.maintenanceDate.gte = new Date(startDate);
    if (endDate) where.maintenanceDate.lte = new Date(endDate);
  }

  const technicianData = await prisma.maintenance.groupBy({
    by: ["technicianId", "status"],
    where,
    _count: { id: true },
  });

  const technicianIds = [
    ...new Set(technicianData.map((item) => item.technicianId)),
  ];

  const technicians = await prisma.employee.findMany({
    where: { id: { in: technicianIds } },
    select: { id: true, fullName: true },
  });

  const technicianMap = Object.fromEntries(
    technicians.map((t) => [t.id, t.fullName])
  );

  const grouped = {};

  technicianData.forEach((item) => {
    const name = technicianMap[item.technicianId] || "Unknown";

    if (!grouped[name]) {
      grouped[name] = {
        technicianName: name,
        completed: 0,
        pending: 0,
        cancelled: 0,
        overdue: 0,
      };
    }

    const status = item.status.toLowerCase();
    grouped[name][status] = item._count.id;
  });

  return Object.values(grouped);
};

/**
 * Overdue Maintenances
 */
export const getOverdueMaintenances = async (prisma, companyId) => {
  const today = new Date();

  const where = {
    status: { in: ["Pending", "Overdue"] },
    maintenanceDate: { lt: today },
  };

  if (companyId) where.companyId = companyId;

  return await prisma.maintenance.findMany({
    where,
    select: {
      id: true,
      maintenanceDate: true,
      price: true,
      customer: {
        select: {
          fullName: true,
          primaryNumber: true,
        },
      },
      technician: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: { maintenanceDate: "asc" },
  });
};

/**
 * ========================================
 * INSTALLMENTS QUERIES
 * ========================================
 */

/**
 * Monthly Collection Trend
 */
export const getMonthlyCollectionTrend = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {
    status: { in: ["Paid", "Partial"] },
  };

  if (companyId) {
    where.installment = {
      invoice: { companyId },
    };
  }

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  } else {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    where.paymentDate = { gte: twelveMonthsAgo };
  }

  const payments = await prisma.installmentPayment.findMany({
    where,
    select: {
      paymentDate: true,
      amountPaid: true,
    },
  });

  const monthlyData = {};

  payments.forEach((payment) => {
    if (!payment.paymentDate) return;

    const month = `${payment.paymentDate.getFullYear()}-${String(
      payment.paymentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        collected: 0,
        paymentCount: 0,
      };
    }

    monthlyData[month].collected += Number(payment.amountPaid);
    monthlyData[month].paymentCount += 1;
  });

  return Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
};

/**
 * Payment Status Distribution
 */
export const getPaymentStatusDistribution = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) {
    where.installment = {
      invoice: { companyId },
    };
  }

  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) where.dueDate.gte = new Date(startDate);
    if (endDate) where.dueDate.lte = new Date(endDate);
  }

  const distribution = await prisma.installmentPayment.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
    _sum: { amountDue: true, amountPaid: true },
  });

  const statusMap = {
    Paid: "مدفوع",
    Partial: "جزئي",
    Pending: "معلق",
  };

  return distribution.map((item) => ({
    status: item.status,
    statusAr: statusMap[item.status] || item.status,
    count: item._count.id,
    totalDue: Number(item._sum.amountDue || 0),
    totalPaid: Number(item._sum.amountPaid || 0),
  }));
};

/**
 * Collection Rate
 */
export const getCollectionRate = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) {
    where.installment = {
      invoice: { companyId },
    };
  }

  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) where.dueDate.gte = new Date(startDate);
    if (endDate) where.dueDate.lte = new Date(endDate);
  }

  const result = await prisma.installmentPayment.aggregate({
    where,
    _sum: {
      amountDue: true,
      amountPaid: true,
    },
  });

  const totalDue = Number(result._sum.amountDue || 0);
  const totalPaid = Number(result._sum.amountPaid || 0);
  const rate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return {
    totalDue,
    totalPaid,
    collectionRate: Number(rate.toFixed(2)),
  };
};

/**
 * Top Delayed Customers
 */
export const getTopDelayedCustomers = async (prisma, companyId, limit = 10) => {
  const today = new Date();

  const where = {
    status: "Pending",
    dueDate: { lt: today },
  };

  if (companyId) {
    where.installment = {
      invoice: { companyId },
    };
  }

  const delayedPayments = await prisma.installmentPayment.groupBy({
    by: ["customerId"],
    where,
    _count: { id: true },
    _sum: { amountDue: true },
    orderBy: { _sum: { amountDue: "desc" } },
    take: limit,
  });

  const customerIds = delayedPayments.map((item) => item.customerId);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, fullName: true, primaryNumber: true },
  });

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  return delayedPayments.map((item) => ({
    customerName: customerMap[item.customerId]?.fullName || "Unknown",
    customerPhone: customerMap[item.customerId]?.primaryNumber,
    delayedPaymentsCount: item._count.id,
    totalOverdue: Number(item._sum.amountDue || 0),
  }));
};

/**
 * ========================================
 * EMPLOYEES PERFORMANCE QUERIES
 * ========================================
 */

/**
 * Sales Leaderboard
 */
export const getSalesLeaderboard = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.contractDate = {};
    if (startDate) where.contractDate.gte = new Date(startDate);
    if (endDate) where.contractDate.lte = new Date(endDate);
  }

  const leaderboard = await prisma.invoice.groupBy({
    by: ["salesRepId"],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });

  const salesRepIds = leaderboard.map((item) => item.salesRepId);

  const employees = await prisma.employee.findMany({
    where: { id: { in: salesRepIds }, role: "SalesRep" },
    select: { id: true, fullName: true },
  });

  const employeeMap = Object.fromEntries(
    employees.map((e) => [e.id, e.fullName])
  );

  return leaderboard.map((item, index) => ({
    rank: index + 1,
    salesRepName: employeeMap[item.salesRepId] || "Unknown",
    totalRevenue: Number(item._sum.totalAmount || 0),
    invoiceCount: item._count.id,
    badge:
      index === 0
        ? "gold"
        : index === 1
        ? "silver"
        : index === 2
        ? "bronze"
        : null,
  }));
};

/**
 * Technician Efficiency
 */
export const getTechnicianEfficiency = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.maintenanceDate = {};
    if (startDate) where.maintenanceDate.gte = new Date(startDate);
    if (endDate) where.maintenanceDate.lte = new Date(endDate);
  }

  const efficiency = await prisma.maintenance.groupBy({
    by: ["technicianId", "status"],
    where,
    _count: { id: true },
  });

  const technicianIds = [
    ...new Set(efficiency.map((item) => item.technicianId)),
  ];

  const technicians = await prisma.employee.findMany({
    where: { id: { in: technicianIds }, role: "Technician" },
    select: { id: true, fullName: true },
  });

  const technicianMap = Object.fromEntries(
    technicians.map((t) => [t.id, t.fullName])
  );

  const grouped = {};

  efficiency.forEach((item) => {
    const name = technicianMap[item.technicianId] || "Unknown";

    if (!grouped[name]) {
      grouped[name] = {
        technicianName: name,
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
      };
    }

    grouped[name].total += item._count.id;

    if (item.status === "Completed") {
      grouped[name].completed += item._count.id;
    } else if (item.status === "Pending") {
      grouped[name].pending += item._count.id;
    }
  });

  Object.values(grouped).forEach((item) => {
    item.completionRate =
      item.total > 0
        ? Number(((item.completed / item.total) * 100).toFixed(2))
        : 0;
  });

  return Object.values(grouped).sort(
    (a, b) => b.completionRate - a.completionRate
  );
};

/**
 * Installations by Technician
 */
export const getInstallationsByTechnician = async (
  prisma,
  companyId,
  startDate,
  endDate
) => {
  const where = {};

  if (companyId) where.companyId = companyId;

  if (startDate || endDate) {
    where.installationDate = {};
    if (startDate) where.installationDate.gte = new Date(startDate);
    if (endDate) where.installationDate.lte = new Date(endDate);
  }

  where.technicianId = { not: null };

  const installations = await prisma.invoice.groupBy({
    by: ["technicianId"],
    where,
    _count: { id: true },
  });

  const technicianIds = installations.map((item) => item.technicianId);

  const technicians = await prisma.employee.findMany({
    where: { id: { in: technicianIds } },
    select: { id: true, fullName: true },
  });

  const technicianMap = Object.fromEntries(
    technicians.map((t) => [t.id, t.fullName])
  );

  return installations
    .map((item) => ({
      technicianName: technicianMap[item.technicianId] || "Unknown",
      installationCount: item._count.id,
    }))
    .sort((a, b) => b.installationCount - a.installationCount);
};

/**
 * ========================================
 * EXECUTIVE SUMMARY QUERIES
 * ========================================
 */

/**
 * Get Month Stats (for comparison)
 */
export const getMonthStats = async (prisma, companyId, monthStart) => {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0); // Last day of month

  const where = {};
  if (companyId) where.companyId = companyId;

  const [invoiceStats, customerCount, maintenanceCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        ...where,
        contractDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    prisma.customer.count({
      where: {
        ...where,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),

    prisma.maintenance.count({
      where: {
        ...where,
        maintenanceDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
  ]);

  return {
    revenue: Number(invoiceStats._sum.totalAmount || 0),
    invoiceCount: invoiceStats._count.id,
    customerCount,
    maintenanceCount,
  };
};

/**
 * Get Critical Alerts
 */
export const getCriticalAlerts = async (prisma, companyId) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  const today = new Date();

  const [
    lowStockCount,
    overduePayments,
    overdueMaintenances,
    expiringContracts,
  ] = await Promise.all([
    // Low stock products
    prisma.product.count({
      where: {
        ...where,
        stock: { lte: 10 },
      },
    }),

    // Overdue installment payments
    prisma.installmentPayment.count({
      where: {
        status: "Pending",
        dueDate: { lt: today },
        installment: companyId ? { invoice: { companyId } } : {},
      },
    }),

    // Overdue maintenances
    prisma.maintenance.count({
      where: {
        ...where,
        status: { in: ["Pending", "Overdue"] },
        maintenanceDate: { lt: today },
      },
    }),

    // Maintenance contracts expiring in next 30 days
    (() => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      return prisma.invoice.count({
        where: {
          ...where,
          saleType: "Installment",
          installationDate: {
            lte: thirtyDaysFromNow,
          },
          maintenancePeriod: { gt: 0 },
        },
      });
    })(),
  ]);

  return {
    lowStockCount,
    overduePayments,
    overdueMaintenances,
    expiringContracts,
  };
};

/**
 * Get Top Performers
 */
export const getTopPerformers = async (prisma, companyId) => {
  const where = {};
  if (companyId) where.companyId = companyId;

  // Current month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [topSalesRep, topTechnician, topProduct] = await Promise.all([
    // Top Sales Rep
    (async () => {
      const result = await prisma.invoice.groupBy({
        by: ["salesRepId"],
        where: {
          ...where,
          contractDate: { gte: monthStart },
        },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 1,
      });

      if (result.length === 0) return null;

      const employee = await prisma.employee.findUnique({
        where: { id: result[0].salesRepId },
        select: { fullName: true },
      });

      return {
        name: employee?.fullName || "Unknown",
        revenue: Number(result[0]._sum.totalAmount || 0),
      };
    })(),

    // Top Technician
    (async () => {
      const result = await prisma.maintenance.groupBy({
        by: ["technicianId"],
        where: {
          ...where,
          status: "Completed",
          maintenanceDate: { gte: monthStart },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      });

      if (result.length === 0) return null;

      const employee = await prisma.employee.findUnique({
        where: { id: result[0].technicianId },
        select: { fullName: true },
      });

      return {
        name: employee?.fullName || "Unknown",
        completedJobs: result[0]._count.id,
      };
    })(),

    // Top Product
    (async () => {
      const result = await prisma.invoiceItem.groupBy({
        by: ["productId"],
        where: {
          productId: { not: null },
          invoice: {
            ...where,
            contractDate: { gte: monthStart },
          },
        },
        _sum: { subtotal: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 1,
      });

      if (result.length === 0) return null;

      const product = await prisma.product.findUnique({
        where: { id: result[0].productId },
        select: { name: true },
      });

      return {
        name: product?.name || "Unknown",
        revenue: Number(result[0]._sum.subtotal || 0),
      };
    })(),
  ]);

  return {
    topSalesRep,
    topTechnician,
    topProduct,
  };
};

export default {
  getMonthlyRevenueTrend,
  getSalesBySalesRep,
  getSalesTypeDistribution,
  getSalesKPIs,
  getTopSellingProducts,
  getSalesByCategory,
  getLowStockAlerts,
  getCategoryMonthlyPerformance,
  getCustomersByCity,
  getCustomerTypeDistribution,
  getTopSpendingCustomers,
  getCustomerGrowthTrend,
  getMaintenanceStatusDistribution,
  getUpcomingMaintenances,
  getMaintenanceByTechnician,
  getOverdueMaintenances,
  getMonthlyCollectionTrend,
  getPaymentStatusDistribution,
  getCollectionRate,
  getTopDelayedCustomers,
  getSalesLeaderboard,
  getTechnicianEfficiency,
  getInstallationsByTechnician,
  getMonthStats,
  getCriticalAlerts,
  getTopPerformers,
};
