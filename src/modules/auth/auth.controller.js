import * as authService from "./auth.service.js";

export const signup = async (request, reply) => {
  const result = await authService.initiateSignup(
    request.server.prisma,
    request.body
  );

  return reply.status(201).send({
    success: true,
    ...result,
  });
};

export const verifyOTP = async (request, reply) => {
  const { email, otp } = request.body;

  const result = await authService.verifyOTP(request.server.prisma, email, otp);

  return reply.send({
    success: true,
    ...result,
  });
};

export const resendOTP = async (request, reply) => {
  const { email } = request.body;

  const result = await authService.resendOTP(request.server.prisma, email);

  return reply.send({
    success: true,
    ...result,
  });
};

export const requestPasswordReset = async (request, reply) => {
  const { email } = request.body;

  const result = await authService.requestPasswordReset(
    request.server.prisma,
    email
  );

  return reply.send({
    success: true,
    ...result,
  });
};

export const resetPassword = async (request, reply) => {
  const { token, newPassword } = request.body;

  const result = await authService.resetPassword(
    request.server.prisma,
    token,
    newPassword
  );

  return reply.send({
    success: true,
    ...result,
  });
};

export const verifyResetToken = async (request, reply) => {
  const { token } = request.params;

  const resetRecord = await request.server.prisma.passwordReset.findFirst({
    where: {
      token,
      expiry: {
        gt: new Date(),
      },
      isUsed: false,
    },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!resetRecord) {
    return reply.status(400).send({
      success: false,
      message: "رابط إعادة التعيين غير صحيح أو منتهي الصلاحية",
    });
  }

  return reply.send({
    success: true,
    valid: true,
    email: resetRecord.user.email,
    fullName: resetRecord.user.fullName,
  });
};
