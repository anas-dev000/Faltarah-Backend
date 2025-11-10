// ==========================================
// employees.repository.js
// ==========================================

/**
 * Fetch all employees with filtering by company + pagination
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 * @param {Number} page - Current page number
 * @param {Number} limit - Number of records per page
 */
export const findAllEmployees = async (prisma, companyId = null, page = 1, limit = 10) => {
  const whereClause = companyId ? { companyId } : {};

  const skip = (page - 1) * limit;

  const employees = await prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      idCardImage: true,
      idCardImagePublicId: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
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

  const total = await prisma.employee.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: employees,
    total,
    totalPages,
    page,
  };
};

/**
 * Retrieve employee by ID with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Employee ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findEmployeeById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findFirst({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      idCardImage: true,
      idCardImagePublicId: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
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
 * Get distinct roles for a company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllRoles = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.employee.findMany({
    where: whereClause,
    distinct: ["role"],
    select: { role: true },
  });
};
/**
 * Get distinct Status for a company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findAllStatus = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.employee.findMany({
    where: whereClause,
    distinct: ["isEmployed"],
    select: { isEmployed: true },
  });
};

/**
 * Fetch employees by role (SalesRep / Technician)
 * @param {Object} prisma - Prisma client
 * @param {String} role - Employee role
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findEmployeesByRole = async (prisma, role, companyId = null) => {
  const whereClause = {
    role,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      city: true,
      createdAt: true,
    },
  });
};

/**
 * Fetch employees by status with company filtering
 * @param {Object} prisma - Prisma client
 * @param {Boolean} isEmployed - Employee status
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findEmployeesByStatus = async (prisma, isEmployed, companyId = null) => {
  const whereClause = {
    isEmployed,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};``
/**
 * Count employees for a specific company
 * @param {Object} prisma - Prisma client
 * @param {Number} companyId - Company ID
 */
export const countEmployeesByCompany = async (prisma, companyId) => {
  return prisma.employee.count({
    where: { companyId },
  });
};

/**
 * Create a new employee
 * @param {Object} prisma - Prisma client
 * @param {Object} data - Employee data
 */
export const createEmployee = async (prisma, data) => {
  return prisma.employee.create({
    data,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      idCardImage: true,
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
 * Update employee with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Employee ID
 * @param {Object} data - Updated fields
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const updateEmployee = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.update({
    where: whereClause,
    data,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      idCardImage: true,
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
 * Delete employee with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Employee ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const deleteEmployee = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.delete({
    where: whereClause,
  });
};

/**
 * Check if national ID exists in the same company
 * @param {Object} prisma - Prisma client
 * @param {String} nationalId - National ID
 * @param {Number} companyId - Company ID
 * @param {Number|null} excludeEmployeeId - Exclude a specific employee (for updates)
 */
export const isNationalIdExistsInCompany = async (
  prisma,
  nationalId,
  companyId,
  excludeEmployeeId = null
) => {
  const whereClause = {
    nationalId,
    companyId,
    ...(excludeEmployeeId && { id: { not: excludeEmployeeId } }),
  };

  const employee = await prisma.employee.findFirst({
    where: whereClause,
  });

  return !!employee;
};
