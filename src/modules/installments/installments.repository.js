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
export async function findAll(prisma, companyId = null, pagination = {}) {
  const where = {};

  if (companyId !== null) {
    where.invoice = {
      companyId,
    };
  }

  // Pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.installment.count({
    where,
  });

  // Get paginated data
  const installments = await prisma.installment.findMany({
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
    skip,
    take: limit,
  });

  return {
    data: installments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
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
 * ✅ Delete installment with cascading deletion of payments
 */
export async function deleteByIdWithRelations(prisma, id) {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all installment payments first
    await tx.installmentPayment.deleteMany({
      where: { installmentId: id },
    });

    // 2. Delete the installment itself
    await tx.installment.delete({
      where: { id },
    });

    return { success: true };
  });
}