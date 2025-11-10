import * as authRepo from "./auth.repository.js";
import * as userRepo from "../users/users.repository.js";
import { hashPassword, comparePassword } from "../../shared/utils/password.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendAdminNotificationEmail,
  sendWelcomeEmail,
} from "../../shared/utils/email.service.js";
import crypto from "crypto";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const initiateSignup = async (prisma, data) => {
  const {
    email,
    fullName,
    password,
    companyName,
    companyPhone,
    companyAddress,
    companyEmail,
  } = data;

  const existingUser = await userRepo.findUserByEmail(prisma, email);
  if (existingUser) {
    throw new AppError("البريد الإلكتروني مسجل بالفعل", 409);
  }

  const companyExists = await authRepo.isCompanyNameExists(prisma, companyName);
  if (companyExists) {
    throw new AppError("اسم الشركة موجود بالفعل", 409);
  }

  const existingPending = await authRepo.findPendingUserByEmail(prisma, email);
  if (existingPending) {
    if (existingPending.isVerified) {
      throw new AppError(
        "البريد الإلكتروني تم تفعيله بالفعل. يرجى انتظار موافقة الإدارة.",
        400
      );
    }

    await authRepo.deletePendingUser(prisma, existingPending.id);
  }

  const hashedPassword = await hashPassword(password);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const pendingUser = await authRepo.createPendingUser(prisma, {
    email,
    fullName,
    passwordHash: hashedPassword,
    companyName,
    companyPhone: companyPhone || null,
    companyAddress: companyAddress || null,
    companyEmail: companyEmail || email,
    otp,
    otpExpiry,
  });

  await sendOTPEmail(email, otp, fullName);

  return {
    message: "OTP sent to your email. Please verify within 10 minutes.",
    email,
  };
};

export const verifyOTP = async (prisma, email, otp) => {
  const pendingUser = await authRepo.findPendingUserByOTP(prisma, email, otp);

  if (!pendingUser) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  await authRepo.updatePendingUserVerification(prisma, pendingUser.id);

  const subscriptionExpiryDate = new Date();
  subscriptionExpiryDate.setDate(subscriptionExpiryDate.getDate() + 10);

  const company = await prisma.company.create({
    data: {
      name: pendingUser.companyName,
      email: pendingUser.companyEmail,
      phone: pendingUser.companyPhone,
      address: pendingUser.companyAddress,
      subscriptionExpiryDate,
    },
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash,
      role: "manager",
      status: "Active",
    },
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

  await authRepo.deletePendingUser(prisma, pendingUser.id);

  await sendAdminNotificationEmail({
    companyName: company.name,
    fullName: user.fullName,
    email: user.email,
    phone: company.phone,
    address: company.address,
    subscriptionExpiryDate: company.subscriptionExpiryDate,
  });

  await sendWelcomeEmail(user.email, user.fullName, company.name);

  return {
    message: "Account verified successfully! You can now login.",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      companyName: company.name,
    },
  };
};

export const resendOTP = async (prisma, email) => {
  const pendingUser = await authRepo.findPendingUserByEmail(prisma, email);

  if (!pendingUser) {
    throw new AppError("No pending registration found for this email", 404);
  }

  if (pendingUser.isVerified) {
    throw new AppError("Email already verified", 400);
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.pendingUser.update({
    where: { id: pendingUser.id },
    data: { otp, otpExpiry },
  });

  await sendOTPEmail(email, otp, pendingUser.fullName);

  return {
    message: "New OTP sent to your email",
    email,
  };
};

export const requestPasswordReset = async (prisma, email) => {
  const user = await userRepo.findUserByEmail(prisma, email);

  if (!user) {
    return {
      message: "If the email exists, a reset link has been sent.",
    };
  }

  if (user.status !== "Active") {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }

  if (user.role !== "developer" && user.company) {
    const company = user.company;
    if (
      company.subscriptionExpiryDate &&
      new Date(company.subscriptionExpiryDate) < new Date()
    ) {
      throw new AppError(
        "Company subscription has expired. Please contact support.",
        403
      );
    }
  }

  const resetToken = generateResetToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await authRepo.createPasswordResetToken(prisma, user.id, resetToken, expiry);

  await sendPasswordResetEmail(user.email, resetToken, user.fullName);

  return {
    message: "If the email exists, a reset link has been sent.",
  };
};

export const resetPassword = async (prisma, token, newPassword) => {
  const resetRecord = await authRepo.findPasswordResetToken(prisma, token);

  if (!resetRecord) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash: hashedPassword },
  });

  await authRepo.markTokenAsUsed(prisma, resetRecord.id);

  return {
    message:
      "Password reset successfully. You can now login with your new password.",
  };
};

export const cleanupExpiredData = async (prisma) => {
  const [pendingUsers, resetTokens] = await Promise.all([
    authRepo.cleanupExpiredPendingUsers(prisma),
    authRepo.cleanupExpiredResetTokens(prisma),
  ]);

  return {
    message: "Cleanup completed",
    deleted: {
      pendingUsers: pendingUsers.count,
      resetTokens: resetTokens.count,
    },
  };
};
