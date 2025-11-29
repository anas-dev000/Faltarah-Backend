// ==========================================
// accessories.repository.js
// ==========================================

/**
 * Find all accessories with filters
 */
export const findAll = async (
  prisma,
  companyId = null,
  filters = {},
  pagination = {}
) => {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  if (filters.lowStock) {
    where.stock = { lte: 20 };
  }

  if (filters.status === "available") {
    where.stock = { gt: 20 };
  } else if (filters.status === "lowStock") {
    where.stock = { gt: 0, lte: 20 };
  } else if (filters.status === "outOfStock") {
    where.stock = 0;
  }

  // Pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.accessory.count({ where });

  // Get paginated data
  const accessories = await prisma.accessory.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      productAccessories: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    skip,
    take: limit,
  });

  return {
    data: accessories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Find accessory by ID
 */
export const findById = async (prisma, id, companyId = null) => {
  const where = { id };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.accessory.findFirst({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          contactInfo: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      productAccessories: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Search accessories by name
 */
export const searchByName = async (prisma, searchTerm, companyId = null) => {
  const where = {
    name: { contains: searchTerm, mode: "insensitive" },
  };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.accessory.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 50,
    orderBy: {
      name: "asc",
    },
  });
};

/**
 * Get accessories statistics
 */
export const getStats = async (prisma, companyId = null) => {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  const [total, stats, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.accessory.count({ where }),
    prisma.accessory.aggregate({
      where,
      _sum: { stock: true },
      _avg: { price: true },
    }),
    prisma.accessory.count({
      where: { ...where, stock: { gt: 0, lte: 20 } },
    }),
    prisma.accessory.count({
      where: { ...where, stock: 0 },
    }),
  ]);

  return {
    totalAccessories: total,
    totalStock: stats._sum.stock || 0,
    averagePrice: stats._avg.price || 0,
    lowStockCount,
    outOfStockCount,
  };
};

/**
 * Find low stock accessories
 */
export const findLowStock = async (
  prisma,
  companyId = null,
  threshold = 20
) => {
  const where = {
    stock: { lte: threshold },
  };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.accessory.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      stock: "asc",
    },
  });
};

/**
 * Find accessory by name and company
 */
export const findByNameAndCompany = async (
  prisma,
  name,
  companyId,
  excludeId = null
) => {
  const where = {
    name: { equals: name, mode: "insensitive" },
    companyId,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return await prisma.accessory.findFirst({ where });
};

/**
 * Create accessory
 */
export const create = async (prisma, data) => {
  return await prisma.accessory.create({
    data,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Update accessory
 */
export const update = async (prisma, id, data) => {
  return await prisma.accessory.update({
    where: { id },
    data,
  });
};

/**
 * Delete accessory (simple - without relations check)
 */
export const deleteById = async (prisma, id) => {
  return await prisma.accessory.delete({
    where: { id },
  });
};

/**
 *  Delete accessory with all related records using transaction
 */
export const deleteByIdWithRelations = async (prisma, id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all ProductAccessory relations
    await tx.productAccessory.deleteMany({
      where: { accessoryId: id },
    });

    // 2. Delete all InvoiceItem records (if any)
    await tx.invoiceItem.deleteMany({
      where: { accessoryId: id },
    });

    // 3. Finally delete the accessory itself
    await tx.accessory.delete({
      where: { id },
    });

    return { success: true };
  });
};
