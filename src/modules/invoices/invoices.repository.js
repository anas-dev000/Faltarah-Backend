/**
 * Invoices Repository
 * Handles all database operations for invoices
 */

/**
 * Find all invoices with optional company filter
 */
export async function findAll(prisma, companyId = null, filters = {}) {
  const where = {};

  if (companyId !== null) {
    where.companyId = companyId;
  }

  if (filters.saleType) {
    where.saleType = filters.saleType;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.contractDate = {};
    if (filters.dateFrom) {
      where.contractDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.contractDate.lte = new Date(filters.dateTo);
    }
  }

  if (filters.customerId) {
    where.customerId = Number(filters.customerId);
  }

  return await prisma.invoice.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
        },
      },
      salesRep: {
        select: {
          id: true,
          fullName: true,
        },
      },
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      invoiceItems: {
        include: {
          product: true,
          accessory: true,
          service: true,
        },
      },
      installment: {
        include: {
          installmentPayments: {
            orderBy: {
              dueDate: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      contractDate: "desc",
    },
  });
}

/**
 * Find invoice by ID with optional company restriction
 */
export async function findById(prisma, id, companyId = null) {
  const where = { id };

  if (companyId !== null) {
    where.companyId = companyId;
  }

  return await prisma.invoice.findFirst({
    where,
    include: {
      customer: true,
      salesRep: true,
      technician: true,
      company: true,
      invoiceItems: {
        include: {
          product: true,
          accessory: true,
          service: true,
        },
      },
      installment: {
        include: {
          installmentPayments: {
            orderBy: {
              dueDate: "asc",
            },
          },
        },
      },
    },
  });
}

/**
 * Get recent invoices
 */
export async function getRecentInvoices(prisma, companyId = null, limit = 5) {
  const where = {};

  if (companyId !== null) {
    where.companyId = companyId;
  }

  return await prisma.invoice.findMany({
    where,
    include: {
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
    orderBy: {
      contractDate: "desc",
    },
    take: limit,
  });
}

/**
 * Calculate monthly revenue
 */
export async function calculateMonthlyRevenue(prisma, companyId = null) {
  const where = {};

  if (companyId !== null) {
    where.companyId = companyId;
  }

  const result = await prisma.invoice.aggregate({
    where,
    _sum: {
      totalAmount: true,
    },
  });

  return result._sum.totalAmount || 0;
}

/**
 * Create new invoice
 */
export async function create(prisma, data) {
  return await prisma.invoice.create({
    data,
    include: {
      customer: true,
      salesRep: true,
      technician: true,
      company: true,
    },
  });
}

/**
 * Update invoice
 */
export async function update(prisma, id, data) {
  return await prisma.invoice.update({
    where: { id },
    data,
    include: {
      customer: true,
      salesRep: true,
      technician: true,
      company: true,
      invoiceItems: {
        include: {
          product: true,
          accessory: true,
          service: true,
        },
      },
    },
  });
}

/**
 * Delete invoice by ID
 */
export async function deleteById(prisma, id) {
  return await prisma.invoice.delete({
    where: { id },
  });
}

// ==============================================
// INVOICE ITEMS REPOSITORY
// ==============================================

/**
 * Find all invoice items for an invoice
 */
export async function findInvoiceItems(prisma, invoiceId) {
  return await prisma.invoiceItem.findMany({
    where: { invoiceId },
    include: {
      product: true,
      accessory: true,
      service: true,
    },
  });
}

/**
 * Create invoice item
 */
export async function createInvoiceItem(prisma, data) {
  return await prisma.invoiceItem.create({
    data,
    include: {
      product: true,
      accessory: true,
      service: true,
    },
  });
}

/**
 * Update invoice item
 */
export async function updateInvoiceItem(prisma, id, data) {
  return await prisma.invoiceItem.update({
    where: { id },
    data,
    include: {
      product: true,
      accessory: true,
      service: true,
    },
  });
}

/**
 * Delete invoice item
 */
export async function deleteInvoiceItem(prisma, id) {
  return await prisma.invoiceItem.delete({
    where: { id },
  });
}

// ==============================================
// INSTALLMENTS REPOSITORY
// ==============================================

/**
 * Find all installments with optional company filter
 */
export async function findAllInstallments(prisma, companyId = null) {
  const where = {};

  if (companyId !== null) {
    where.invoice = {
      companyId,
    };
  }

  return await prisma.installment.findMany({
    where,
    include: {
      invoice: {
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      installmentPayments: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Find installment by ID
 */
export async function findInstallmentById(prisma, id, companyId = null) {
  const where = { id };

  if (companyId !== null) {
    where.invoice = {
      companyId,
    };
  }

  return await prisma.installment.findFirst({
    where,
    include: {
      invoice: {
        include: {
          customer: true,
        },
      },
      installmentPayments: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });
}

/**
 * Find installment by invoice ID
 */
export async function findInstallmentByInvoiceId(prisma, invoiceId) {
  return await prisma.installment.findUnique({
    where: { invoiceId },
    include: {
      invoice: true,
      installmentPayments: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });
}

/**
 * Create installment
 */
export async function createInstallment(prisma, data) {
  return await prisma.installment.create({
    data,
    include: {
      invoice: true,
    },
  });
}

/**
 * Update installment
 */
export async function updateInstallment(prisma, id, data) {
  return await prisma.installment.update({
    where: { id },
    data,
    include: {
      invoice: true,
      installmentPayments: true,
    },
  });
}

/**
 * Delete installment
 */
export async function deleteInstallment(prisma, id) {
  return await prisma.installment.delete({
    where: { id },
  });
}

// ==============================================
// INSTALLMENT PAYMENTS REPOSITORY
// ==============================================

/**
 * Find all installment payments with optional filters
 */
export async function findAllInstallmentPayments(
  prisma,
  companyId = null,
  filters = {}
) {
  const where = {};

  if (companyId !== null) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.customerId) {
    where.customerId = Number(filters.customerId);
  }

  return await prisma.installmentPayment.findMany({
    where,
    include: {
      installment: {
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          fullName: true,
          primaryNumber: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

/**
 * Count pending installment payments
 */
export async function countPendingPayments(prisma, companyId = null) {
  const where = {
    status: "Pending",
  };

  if (companyId !== null) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }

  return await prisma.installmentPayment.count({ where });
}

/**
 * Count overdue payments
 */
export async function countOverduePayments(prisma, companyId = null) {
  const where = {
    status: "Pending",
    dueDate: {
      lt: new Date(),
    },
  };

  if (companyId !== null) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }

  return await prisma.installmentPayment.count({ where });
}

/**
 * Create installment payment
 */
export async function createInstallmentPayment(prisma, data) {
  return await prisma.installmentPayment.create({
    data,
    include: {
      installment: true,
      customer: true,
    },
  });
}

/**
 * Update installment payment
 */
export async function updateInstallmentPayment(prisma, id, data) {
  return await prisma.installmentPayment.update({
    where: { id },
    data,
    include: {
      installment: true,
      customer: true,
    },
  });
}

/**
 * Delete installment payment
 */
export async function deleteInstallmentPayment(prisma, id) {
  return await prisma.installmentPayment.delete({
    where: { id },
  });
}

/**
 * Find installment payment by ID
 */
export async function findInstallmentPaymentById(prisma, id, companyId = null) {
  const where = { id };

  if (companyId !== null) {
    where.installment = {
      invoice: {
        companyId,
      },
    };
  }

  return await prisma.installmentPayment.findFirst({
    where,
    include: {
      installment: {
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}