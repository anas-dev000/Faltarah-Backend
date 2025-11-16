// ==========================================
// products.repository.js
// ==========================================

/**
 * Find all products with filters
 */
export const findAll = async (prisma, companyId = null, filters = {}) => {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.lowStock) {
    where.stock = { lte: 10 };
  }

  if (filters.status === "available") {
    where.stock = { gt: 10 };
  } else if (filters.status === "lowStock") {
    where.stock = { gt: 0, lte: 10 };
  } else if (filters.status === "outOfStock") {
    where.stock = 0;
  }

  return await prisma.product.findMany({
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
          accessory: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
};

/**
 * Find product by ID
 */
export const findById = async (prisma, id, companyId = null) => {
  const where = { id };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.product.findFirst({
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
          accessory: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Search products by name
 */
export const searchByName = async (prisma, searchTerm, companyId = null) => {
  const where = {
    OR: [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { category: { contains: searchTerm, mode: "insensitive" } },
    ],
  };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.product.findMany({
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
 * Get all unique categories
 */
export const getCategories = async (prisma, companyId = null) => {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return products.map((p) => p.category);
};

/**
 * Get products statistics
 */
export const getStats = async (prisma, companyId = null) => {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  const [total, stats, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.aggregate({
      where,
      _sum: { stock: true },
      _avg: { price: true },
    }),
    prisma.product.count({
      where: { ...where, stock: { gt: 0, lte: 10 } },
    }),
    prisma.product.count({
      where: { ...where, stock: 0 },
    }),
  ]);

  return {
    totalProducts: total,
    totalStock: stats._sum.stock || 0,
    averagePrice: stats._avg.price || 0,
    lowStockCount,
    outOfStockCount,
  };
};

/**
 * Find low stock products
 */
export const findLowStock = async (
  prisma,
  companyId = null,
  threshold = 10
) => {
  const where = {
    stock: { lte: threshold },
  };

  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.product.findMany({
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
 * Find product by name and company
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

  return await prisma.product.findFirst({ where });
};

/**
 * Create product
 */
export const create = async (prisma, data) => {
  return await prisma.product.create({
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
 * Update product
 */
export const update = async (prisma, id, data) => {
  return await prisma.product.update({
    where: { id },
    data,
  });
};

/**
 * ✅ Delete product with all related records using transaction
 */
export const deleteByIdWithRelations = async (prisma, id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all ProductAccessory relations
    await tx.productAccessory.deleteMany({
      where: { productId: id },
    });

    // 2. Delete all InvoiceItems referencing this product
    await tx.invoiceItem.deleteMany({
      where: { productId: id },
    });

    // 3. Delete all Maintenances referencing this product
    await tx.maintenance.deleteMany({
      where: { productId: id },
    });

    // 4. Finally delete the product
    await tx.product.delete({
      where: { id },
    });

    return { success: true };
  });
};

/**
 * Link accessories to product
 */
export const linkAccessories = async (prisma, productId, accessoryIds) => {
  const data = accessoryIds.map((accessoryId) => ({
    productId,
    accessoryId,
  }));

  return await prisma.productAccessory.createMany({
    data,
    skipDuplicates: true,
  });
};