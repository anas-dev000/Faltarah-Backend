// ==========================================
// users.repository.js
// ==========================================

/**
 * Fetch all users with filtering by company
 * @param {Object} prisma - Prisma client
 * @param {Number|null} companyId - Company ID (null for developers)
 */

export const findAllUsers = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
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
};

/**
 * Retrieve user by ID with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - User ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const findUserById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.user.findFirst({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
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

export const findUserByEmail = async (prisma, email) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          subscriptionExpiryDate: true,
        },
      },
    },
  });
};

/**
 * Create a new user
 * @param {Object} prisma - Prisma client
 * @param {Object} data - User data
 */
export const createUser = async (prisma, data) => {
  return prisma.user.create({
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
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
 * User update with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - User ID
 * @param {Object} data - Data to be updated
 * @param {Number|null} companyId - Company ID (null for developers)
 */
export const updateUser = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.user.update({
    where: whereClause,
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
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
 * Delete user with company verification
 * @param {Object} prisma - Prisma client
 * @param {Number} id - User ID
 * @param {Number|null} companyId - Company ID (null for developers)
 */ export const deleteUser = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.user.delete({
    where: whereClause,
  });
};

/**
 * Checking for an email address at a specific company
 * @param {Object} prisma - Prisma client
 * @param {String} email - Email address
 * @param {Number} companyId - Company ID
 * @param {Number|null} excludeUserId - Exclude a specific user (for updates)
 */
export const isEmailExistsInCompany = async (
  prisma,
  email,
  companyId,
  excludeUserId = null
) => {
  const whereClause = {
    email,
    companyId,
    ...(excludeUserId && { id: { not: excludeUserId } }),
  };

  const user = await prisma.user.findFirst({
    where: whereClause,
  });

  return !!user;
};

/**
 * Count users in a specific company
 * @param {Object} prisma - Prisma client
 * @param {Number} companyId - Company ID
 */
export const countUsersByCompany = async (prisma, companyId) => {
  return prisma.user.count({
    where: { companyId },
  });
};
