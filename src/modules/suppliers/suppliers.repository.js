/**
 * Suppliers Repository
 * Handles all database operations for suppliers
 */

/**
 * Find all suppliers with optional company filter
 */
export async function findAll(prisma, companyId = null, filters = {}) {
  const where = {};

  if (companyId !== null) {
    where.companyId = companyId;
  }

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
 * ✅ Delete supplier with all related records using transaction
 */
export async function deleteByIdWithRelations(prisma, id) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all products from this supplier
    const products = await tx.product.findMany({
      where: { supplierId: id },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      // 2. Delete all ProductAccessory relations
      await tx.productAccessory.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 3. Delete all InvoiceItems referencing these products
      await tx.invoiceItem.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 4. Delete all Maintenances referencing these products
      await tx.maintenance.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 5. Delete all products
      await tx.product.deleteMany({
        where: { supplierId: id },
      });
    }

    // 6. Get all accessories from this supplier
    const accessories = await tx.accessory.findMany({
      where: { supplierId: id },
      select: { id: true },
    });

    const accessoryIds = accessories.map((a) => a.id);

    if (accessoryIds.length > 0) {
      // 7. Delete all ProductAccessory relations
      await tx.productAccessory.deleteMany({
        where: { accessoryId: { in: accessoryIds } },
      });

      // 8. Delete all InvoiceItems referencing these accessories
      await tx.invoiceItem.deleteMany({
        where: { accessoryId: { in: accessoryIds } },
      });

      // 9. Delete all accessories
      await tx.accessory.deleteMany({
        where: { supplierId: id },
      });
    }

    // 10. Finally delete the supplier
    await tx.supplier.delete({
      where: { id },
    });

    return { success: true };
  });
}

/**
 * ✅ Check supplier relations (for information only)
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