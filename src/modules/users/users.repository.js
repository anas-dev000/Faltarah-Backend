// ==========================================
// users.repository.js
// ==========================================

/**
 * Fetch all users with filtering by company
 */
export const findAllUsers = async (prisma, companyId = null, pagination = {}) => {
  const whereClause = companyId ? { companyId } : {};

  // Pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.user.count({
    where: whereClause,
  });

  // Get paginated data
  const users = await prisma.user.findMany({
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
    skip,
    take: limit,
  });

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
};

/**
 * Retrieve user by ID with company verification
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
          subscriptionExpiryDate: true,
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
 * ✅ Delete user with cascading deletion (no actual cascading needed for users in this schema)
 */
export const deleteUser = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  // Users don't have any direct foreign key references that need cascading
  // They are referenced by other tables but not in a way that prevents deletion
  return prisma.user.delete({
    where: whereClause,
  });
};

/**
 * Checking for an email address at a specific company
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
 */
export const countUsersByCompany = async (prisma, companyId) => {
  return prisma.user.count({
    where: { companyId },
  });
};