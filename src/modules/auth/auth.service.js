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
  // 1. التحقق من OTP
  const pendingUser = await authRepo.findPendingUserByOTP(prisma, email, otp);

  if (!pendingUser) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  // 2. التحقق من أن المستخدم لم يتم تفعيله مسبقاً
  if (pendingUser.isVerified) {
    throw new AppError(
      "البريد الإلكتروني تم تفعيله بالفعل. يرجى انتظار موافقة الإدارة.",
      400
    );
  }

  try {
    console.log("🔄 Starting OTP verification transaction...");

    //  استخدام Transaction للتأكد من نجاح جميع العمليات
    const result = await prisma.$transaction(
      async (tx) => {
        console.log(" Step 1: Updating pending user verification...");
        // 1. تحديث حالة المستخدم المعلق
        await tx.pendingUser.update({
          where: { id: pendingUser.id },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
          },
        });

        console.log(" Step 2: Finding Trial plan...");
        // 2. الحصول على خطة Trial
        const trialPlan = await tx.subscriptionPlan.findFirst({
          where: { name: "Trial", isActive: true },
        });

        if (!trialPlan) {
          console.error("❌ Trial plan not found!");
          throw new AppError("Trial plan not found in system", 500);
        }

        console.log(
          ` Found trial plan: ${trialPlan.name} (${trialPlan.durationDays} days)`
        );

        // 3. حساب تواريخ الاشتراك التجريبي
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + trialPlan.durationDays);

        console.log(
          ` Step 3: Creating company with trial until ${endDate.toISOString()}...`
        );
        // 4. إنشاء الشركة
        const company = await tx.company.create({
          data: {
            name: pendingUser.companyName,
            email: pendingUser.companyEmail,
            phone: pendingUser.companyPhone,
            address: pendingUser.companyAddress,
            subscriptionExpiryDate: endDate,
          },
        });

        console.log(` Company created: ${company.name} (ID: ${company.id})`);

        console.log(" Step 4: Creating user...");
        // 5. إنشاء المستخدم (Manager)
        const user = await tx.user.create({
          data: {
            companyId: company.id,
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            passwordHash: pendingUser.passwordHash,
            role: "manager",
            status: "Active",
          },
        });

        console.log(` User created: ${user.fullName} (ID: ${user.id})`);

        console.log(" Step 5: Creating trial subscription...");
        // 6. إنشاء الاشتراك التجريبي
        const trialSubscription = await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: trialPlan.id,
            status: "active",
            startDate: startDate,
            endDate: endDate,
            autoRenew: false,
          },
          include: {
            plan: true,
          },
        });

        console.log(
          ` Trial subscription created (ID: ${trialSubscription.id})`
        );

        console.log(" Step 6: Creating trial invoice...");
        // 7. إنشاء فاتورة الاشتراك التجريبي
        const invoice = await tx.subscriptionInvoice.create({
          data: {
            companyId: company.id,
            subscriptionId: trialSubscription.id,
            planName: trialPlan.name,
            amount: 0.0,
            durationDays: trialPlan.durationDays,
            paymentMethod: "trial",
            paymentStatus: "paid",
            paidAt: startDate,
            notes: "Trial subscription - Auto-created on signup verification",
          },
        });

        console.log(` Trial invoice created (ID: ${invoice.id})`);

        return {
          user,
          company,
          subscription: trialSubscription,
        };
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 20000, // 20 seconds
      }
    );

    console.log(" Transaction completed successfully!");

    // 8.  الآن نحذف المستخدم المعلق بعد نجاح كل شيء
    console.log(" Step 7: Deleting pending user...");
    await authRepo.deletePendingUser(prisma, pendingUser.id);

    console.log(" Step 8: Sending emails...");
    // 9. إرسال الإيميلات (خارج الـ transaction)
    try {
      await Promise.allSettled([
        sendAdminNotificationEmail({
          companyName: result.company.name,
          fullName: result.user.fullName,
          email: result.user.email,
          phone: result.company.phone || "",
          address: result.company.address || "",
          subscriptionExpiryDate: result.company.subscriptionExpiryDate,
        }),
        sendWelcomeEmail(
          result.user.email,
          result.user.fullName,
          result.company.name
        ),
      ]);
      console.log(" Emails sent successfully");
    } catch (emailError) {
      // لا نريد أن يفشل التسجيل بسبب الإيميلات
      console.error("⚠️ Email sending failed (non-critical):", emailError);
    }

    console.log(" OTP verification completed!");

    return {
      message:
        "Account verified successfully with trial subscription! You can now login.",
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        companyName: result.company.name,
      },
      subscription: {
        plan: result.subscription.plan.nameAr,
        status: result.subscription.status,
        startDate: result.subscription.startDate,
        endDate: result.subscription.endDate,
        daysRemaining: result.subscription.plan.durationDays,
      },
    };
  } catch (error) {
    console.error("❌ Error in OTP verification:", error);

    // لو الـ error من AppError نرميه زي ما هو
    if (error instanceof AppError) {
      throw error;
    }

    // لو error من Prisma
    if (error.code) {
      console.error("❌ Prisma error code:", error.code);
      console.error("❌ Prisma error meta:", error.meta);
    }

    throw new AppError(
      error.message || "Failed to verify OTP and create account",
      500
    );
  }
};

export const resendOTP = async (prisma, email) => {
  const pendingUser = await authRepo.findPendingUserByEmail(prisma, email);

  if (!pendingUser) {
    throw new AppError("No pending registration found for this email", 404);
  }

  //  لو المستخدم تم تفعيله، يبقى الحساب جاهز
  if (pendingUser.isVerified) {
    throw new AppError("تم تفعيل حسابك بالفعل! يمكنك تسجيل الدخول الآن", 400);
  }

  //  إنشاء OTP جديد
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.pendingUser.update({
    where: { id: pendingUser.id },
    data: { otp, otpExpiry },
  });

  // إرسال OTP
  try {
    await sendOTPEmail(email, otp, pendingUser.fullName);
  } catch (emailError) {
    console.error("⚠️ Failed to send OTP email:", emailError);
    throw new AppError("Failed to send OTP email. Please try again.", 500);
  }

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
