/**
 * Installments Repository
 * Handles all database operations for installments
 */

// ==============================================
// INSTALLMENTS REPOSITORY
// ==============================================

/**
 * Find all installments with optional company filter
 */
export async function findAll(prisma, companyId = null) {
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
              primaryNumber: true,
              city: true,
            },
          },
          salesRep: {
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
export async function findById(prisma, id, companyId = null) {
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
          salesRep: true,
          technician: true,
          invoiceItems: {
            include: {
              product: true,
              accessory: true,
              service: true,
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
  });
}

/**
 * Find installment by invoice ID
 */
export async function findByInvoiceId(prisma, invoiceId) {
  return await prisma.installment.findUnique({
    where: { invoiceId },
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
 * Create installment
 */
export async function create(prisma, data) {
  return await prisma.installment.create({
    data,
    include: {
      invoice: {
        include: {
          customer: true,
        },
      },
    },
  });
}

/**
 * Update installment
 */
export async function update(prisma, id, data) {
  return await prisma.installment.update({
    where: { id },
    data,
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
 * Delete installment
 */
export async function deleteById(prisma, id) {
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
export async function findAllPayments(prisma, companyId = null, filters = {}) {
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

  if (filters.installmentId) {
    where.installmentId = Number(filters.installmentId);
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
                  primaryNumber: true,
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
 * Find payment by ID
 */
export async function findPaymentById(prisma, id, companyId = null) {
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

/**
 * Get next payment for a customer's installment
 */
export async function getNextPayment(prisma, installmentId) {
  return await prisma.installmentPayment.findFirst({
    where: {
      installmentId,
      status: {
        in: ["Pending", "Partial"],
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

/**
 * Count pending payments
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
export async function createPayment(prisma, data) {
  return await prisma.installmentPayment.create({
    data,
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

/**
 * Update installment payment
 */
export async function updatePayment(prisma, id, data) {
  return await prisma.installmentPayment.update({
    where: { id },
    data,
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

/**
 * Delete installment payment
 */
export async function deletePayment(prisma, id) {
  return await prisma.installmentPayment.delete({
    where: { id },
  });
}

/**
 * Find payments by installment ID
 */
export async function findPaymentsByInstallmentId(prisma, installmentId) {
  return await prisma.installmentPayment.findMany({
    where: { installmentId },
    orderBy: {
      dueDate: "asc",
    },
  });
}