/**
 * InstallmentPayments Repository
 * Handles all database operations for installment payments
 */

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
    orderBy: [{ installmentId: "asc" }, { dueDate: "asc" }],
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
 * ✅ Delete installment payment (simple - no cascading needed)
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
    include: {
      customer: true,
    },
  });
}

/**
 * Find all payments for an installment with details
 */
export async function findPaymentsByInstallmentIdWithDetails(
  prisma,
  installmentId
) {
  return await prisma.installmentPayment.findMany({
    where: { installmentId },
    orderBy: {
      dueDate: "asc",
    },
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
 * Check if any payment exists for an installment
 */
export async function hasPayments(prisma, installmentId) {
  const count = await prisma.installmentPayment.count({
    where: { installmentId },
  });

  return count > 0;
}

/**
 * Get last payment for installment
 */
export async function getLastPayment(prisma, installmentId) {
  return await prisma.installmentPayment.findFirst({
    where: { installmentId },
    orderBy: {
      dueDate: "desc",
    },
  });
}

/**
 * Count closed payments (Paid or Partial)
 */
export async function countClosedPayments(prisma, installmentId) {
  return await prisma.installmentPayment.count({
    where: {
      installmentId,
      status: {
        in: ["Paid", "Partial"],
      },
    },
  });
}

/**
 * Get total paid amount for installment
 */
export async function getTotalPaidAmount(prisma, installmentId) {
  const result = await prisma.installmentPayment.aggregate({
    where: { installmentId },
    _sum: {
      amountPaid: true,
    },
  });

  return result._sum.amountPaid || 0;
}

/**
 * Get total remaining amount for installment
 */
export async function getTotalRemainingAmount(prisma, installmentId) {
  const result = await prisma.installmentPayment.aggregate({
    where: { installmentId },
    _sum: {
      amountDue: true,
    },
  });

  const totalDue = result._sum.amountDue || 0;
  const totalPaid = await getTotalPaidAmount(prisma, installmentId);

  return Math.max(0, totalDue - totalPaid);
}