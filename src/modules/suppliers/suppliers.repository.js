/**
 * Fetch all suppliers with filtering by company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllSuppliers = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.supplier.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      contactInfo: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

/**
 * Retrieve supplier by ID with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Supplier ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findSupplierById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.supplier.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
      contactInfo: true,
      companyId: true,
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
 * Create a new supplier
 * @param {Object} prisma - Prisma client
 * @param {Object} data - Supplier data
 */
export const createSupplier = async (prisma, data) => {
  return prisma.supplier.create({
    data,
    select: {
      id: true,
      name: true,
      contactInfo: true,
      companyId: true,
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
 * Update supplier with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Supplier ID
 * @param {Object} data - Data to update
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const updateSupplier = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.supplier.update({
    where: whereClause,
    data,
    select: {
      id: true,
      name: true,
      contactInfo: true,
      companyId: true,
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
 * Delete supplier with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Supplier ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const deleteSupplier = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.supplier.delete({
    where: whereClause,
  });
};

/**
 * Check if supplier name exists in a company
 * @param {Object} prisma - Prisma client
 * @param {String} name - Supplier name
 * @param {Number} companyId - Company ID
 * @param {Number|null} excludeSupplierId - Exclude current supplier (for updates)
 */
export const isSupplierNameExistsInCompany = async (
  prisma,
  name,
  companyId,
  excludeSupplierId = null
) => {
  const whereClause = {
    name,
    companyId,
    ...(excludeSupplierId && { id: { not: excludeSupplierId } }),
  };

  const supplier = await prisma.supplier.findFirst({
    where: whereClause,
  });

  return !!supplier;
};