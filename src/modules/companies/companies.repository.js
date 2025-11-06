// ==========================================
// companies.repository.js
// ==========================================

/**
 * Fetch all companies with optional filtering
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers to see all)
 */
export const findAllCompanies = async (prisma, companyId = null) => {
  const whereClause = companyId ? { id: companyId } : {};

  return prisma.company.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          customers: true,
          invoices: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Retrieve company by ID
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Company ID
 * @param {Number|null} restrictToCompanyId - Restrict to specific company (null for developers)
 */
export const findCompanyById = async (
  prisma,
  id,
  restrictToCompanyId = null
) => {
  const whereClause = {
    id,
    ...(restrictToCompanyId && { id: restrictToCompanyId }),
  };

  return prisma.company.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          customers: true,
          employees: true,
          suppliers: true,
          products: true,
          accessories: true,
          services: true,
          maintenances: true,
          invoices: true,
        },
      },
    },
  });
};

/**
 * Check if company name exists
 * @param {Object} prisma - Prisma client
 * @param {String} name - Company name
 * @param {Number|null} excludeCompanyId - Exclude specific company (for updates)
 */
export const findCompanyByName = async (
  prisma,
  name,
  excludeCompanyId = null
) => {
  const whereClause = {
    name,
    ...(excludeCompanyId && { id: { not: excludeCompanyId } }),
  };

  return prisma.company.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
    },
  });
};

/**
 * Create a new company
 * @param {Object} prisma - Prisma client
 * @param {Object} data - Company data
 */
export const createCompany = async (prisma, data) => {
  return prisma.company.create({
    data,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
    },
  });
};

/**
 * Update existing company
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Company ID
 * @param {Object} data - Data to be updated
 */
export const updateCompany = async (prisma, id, data) => {
  return prisma.company.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
    },
  });
};

/**
 * Delete company
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Company ID
 */
export const deleteCompany = async (prisma, id) => {
  return prisma.company.delete({
    where: { id },
  });
};

/**
 * Count total companies
 * @param {Object} prisma - Prisma client
 */
export const countCompanies = async (prisma) => {
  return prisma.company.count();
};

/**
 * Check if company has related records
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Company ID
 */
export const checkCompanyRelations = async (prisma, id) => {
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          users: true,
          customers: true,
          employees: true,
          suppliers: true,
          products: true,
          accessories: true,
          services: true,
          maintenances: true,
          invoices: true,
        },
      },
    },
  });

  if (!company) return null;

  const totalRelations = Object.values(company._count).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    hasRelations: totalRelations > 0,
    counts: company._count,
    totalRelations,
  };
};
