/**
 * Suppliers Repository
 * Handles all database operations for suppliers
 */

/**
 * Find all suppliers with optional company filter
 */
export async function findAll(prisma, companyId = null, filters = {}) {
  const where = {};

  // Apply company filter if provided
  if (companyId !== null) {
    where.companyId = companyId;
  }

  // Apply search filter
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { contactInfo: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return await prisma.supplier.findMany({
    where,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
          accessories: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
}

/**
 * Search suppliers by name or contact info
 */
export async function searchByNameOrContact(
  prisma,
  searchTerm,
  companyId = null
) {
  const where = {
    OR: [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { contactInfo: { contains: searchTerm, mode: "insensitive" } },
    ],
  };

  if (companyId !== null) {
    where.companyId = companyId;
  }

  return await prisma.supplier.findMany({
    where,
    include: {
      company: {
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
}

/**
 * Find supplier by ID with optional company restriction
 */
export async function findById(prisma, id, companyId = null) {
  const where = { id };

  if (companyId !== null) {
    where.companyId = companyId;
  }

  return await prisma.supplier.findFirst({
    where,
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          products: true,
          accessories: true,
        },
      },
      products: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          stock: true,
        },
        take: 10,
      },
      accessories: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          stock: true,
        },
        take: 10,
      },
    },
  });
}

/**
 * Find supplier by name and company (for duplicate checking)
 */
export async function findByNameAndCompany(
  prisma,
  name,
  companyId,
  excludeSupplierId = null
) {
  const where = {
    name: { equals: name, mode: "insensitive" },
    companyId,
  };

  if (excludeSupplierId) {
    where.id = { not: excludeSupplierId };
  }

  return await prisma.supplier.findFirst({
    where,
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Create new supplier
 */
export async function create(prisma, data) {
  return await prisma.supplier.create({
    data,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Update supplier
 */
export async function update(prisma, id, data) {
  return await prisma.supplier.update({
    where: { id },
    data,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
          accessories: true,
        },
      },
    },
  });
}

/**
 * Delete supplier by ID
 */
export async function deleteById(prisma, id) {
  return await prisma.supplier.delete({
    where: { id },
  });
}

/**
 * Check if supplier has related products or accessories
 */
export async function checkSupplierRelations(prisma, supplierId) {
  const [productsCount, accessoriesCount] = await Promise.all([
    prisma.product.count({
      where: { supplierId },
    }),
    prisma.accessory.count({
      where: { supplierId },
    }),
  ]);

  const totalRelations = productsCount + accessoriesCount;

  return {
    hasRelations: totalRelations > 0,
    counts: {
      products: productsCount,
      accessories: accessoriesCount,
    },
    totalRelations,
  };
}
