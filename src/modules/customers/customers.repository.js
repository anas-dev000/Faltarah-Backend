// ==========================================
// customers.repository.js
// ==========================================

/**
 * Fetch all customers with filtering by company + pagination
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 * @param {Number} page - Current page number
 * @param {Number} limit - Number of records per page
 */
export const findAllCustomers = async (prisma, companyId = null, page = 1, limit = 10) => {
  const whereClause = companyId ? { companyId } : {};

  const skip = (page - 1) * limit;

  // Get paginated customers
  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      idCardImage: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get total count for pagination
  const total = await prisma.customer.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: customers,
    total,
    totalPages,
    page,
  };
};

/**
 * Retrieve customer by ID with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findCustomerById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findFirst({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      idCardImage: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

/**
 * Get distinct governorates for a company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllTypes = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["customerType"],
    select: { customerType: true },
  });
};


/**
 * Fetch customers by type (Installation / Maintenance)
 * @param {Object} prisma - Prisma client
 * @param {String} customerType - Customer type
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findCustomersByType = async (prisma, customerType, companyId = null) => {
  const whereClause = {
    customerType,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      city: true,
      createdAt: true,
    },
  });
};

/**
 * Get distinct governorates for a company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllGovernorates = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["governorate"],
    select: { governorate: true },
  });
};

/**
 * Get distinct governorates for a company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllCities = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["city"],
    select: { city: true },
  });
};


/**
 * Get distinct cities for a specific governorate
 * @param {Object} prisma - Prisma client
 * @param {String} governorate - Governorate name
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findCitiesByGovernorate = async (prisma, governorate, companyId = null) => {
  const whereClause = {
    governorate,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["city"],
    select: { city: true },
  });
};

/**
 * Count customers for a specific company
 * @param {Object} prisma - Prisma client
 * @param {Number} companyId - Company ID
 */
export const countCustomersByCompany = async (prisma, companyId) => {
  return prisma.customer.count({
    where: { companyId },
  });
};

/**
 * Create a new customer
 * @param {Object} prisma - Prisma client
 * @param {Object} data - Customer data
 */
export const createCustomer = async (prisma, data) => {
  return prisma.customer.create({
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
      idCardImage:true,
      idCardImagePublicId: true,
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
 * Update customer with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Object} data - Updated fields
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const updateCustomer = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.update({
    where: whereClause,
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
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
 * Delete customer with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const deleteCustomer = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.delete({
    where: whereClause,
  });
};

/**
 * Check if national ID exists in the same company
 * @param {Object} prisma - Prisma client
 * @param {String} nationalId - National ID
 * @param {Number} companyId - Company ID
 * @param {Number|null} excludeCustomerId - Exclude a specific customer (for updates)
 */
export const isNationalIdExistsInCompany = async (
  prisma,
  nationalId,
  companyId,
  excludeCustomerId = null
) => {
  const whereClause = {
    nationalId,
    companyId,
    ...(excludeCustomerId && { id: { not: excludeCustomerId } }),
  };

  const customer = await prisma.customer.findFirst({
    where: whereClause,
  });

  return !!customer;
};
