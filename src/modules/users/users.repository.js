// ==========================================
// users.repository.js
// ==========================================

export const findAllUsers = async (prisma) => {
  return prisma.user.findMany({
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};

export const findUserById = async (prisma, id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};

export const findUserByEmail = async (prisma, email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

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
    },
  });
};

export const updateUser = async (prisma, id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};

export const deleteUser = async (prisma, id) => {
  return prisma.user.delete({
    where: { id },
  });
};
