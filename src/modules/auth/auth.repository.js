export const createPendingUser = async (prisma, data) => {
  return prisma.pendingUser.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      companyName: data.companyName,
      companyPhone: data.companyPhone,
      companyAddress: data.companyAddress,
      companyEmail: data.companyEmail,
      otp: data.otp,
      otpExpiry: data.otpExpiry,
    },
  });
};

export const findPendingUserByEmail = async (prisma, email) => {
  return prisma.pendingUser.findUnique({
    where: { email },
  });
};

export const findPendingUserByOTP = async (prisma, email, otp) => {
  return prisma.pendingUser.findFirst({
    where: {
      email,
      otp,
      otpExpiry: {
        gt: new Date(),
      },
      isVerified: false,
    },
  });
};

export const updatePendingUserVerification = async (prisma, id) => {
  return prisma.pendingUser.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
    },
  });
};

export const deletePendingUser = async (prisma, id) => {
  return prisma.pendingUser.delete({
    where: { id },
  });
};

export const createPasswordResetToken = async (
  prisma,
  userId,
  token,
  expiry
) => {
  await prisma.passwordReset.deleteMany({
    where: { userId },
  });

  return prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiry,
    },
  });
};

export const findPasswordResetToken = async (prisma, token) => {
  return prisma.passwordReset.findFirst({
    where: {
      token,
      expiry: {
        gt: new Date(),
      },
      isUsed: false,
    },
    include: {
      user: true,
    },
  });
};

export const markTokenAsUsed = async (prisma, id) => {
  return prisma.passwordReset.update({
    where: { id },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  });
};

export const isCompanyNameExists = async (
  prisma,
  companyName,
  excludeId = null
) => {
  const whereClause = {
    name: companyName,
    ...(excludeId && { id: { not: excludeId } }),
  };

  const company = await prisma.company.findFirst({
    where: whereClause,
  });

  return !!company;
};

export const cleanupExpiredPendingUsers = async (prisma) => {
  return prisma.pendingUser.deleteMany({
    where: {
      otpExpiry: {
        lt: new Date(),
      },
      isVerified: false,
    },
  });
};

export const cleanupExpiredResetTokens = async (prisma) => {
  return prisma.passwordReset.deleteMany({
    where: {
      expiry: {
        lt: new Date(),
      },
    },
  });
};
