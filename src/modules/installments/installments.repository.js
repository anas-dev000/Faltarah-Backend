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
