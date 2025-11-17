// ==========================================
// subscriptionCheck.middleware.js
// ==========================================

import { AppError } from "../errors/AppError.js";

/**
 * Middleware to check if company subscription is active
 * Blocks access to protected routes if subscription is expired
 * Developer role bypasses this check
 */
export async function checkSubscription(request, reply) {
  const user = request.user;

  // Developer لا يحتاج للتحقق من الاشتراك
  if (user.role === "developer") {
    return;
  }

  // إذا لم يكن لدى المستخدم شركة (نادراً)
  if (!user.companyId) {
    throw new AppError("User is not associated with any company", 403);
  }

  try {
    // البحث عن اشتراك نشط
    const activeSubscription =
      await request.server.prisma.subscription.findFirst({
        where: {
          companyId: user.companyId,
          status: "active",
          endDate: {
            gte: new Date(),
          },
        },
      });

    if (!activeSubscription) {
      // لا يوجد اشتراك نشط
      return reply.status(402).send({
        success: false,
        error: "Subscription Required",
        message:
          "Your subscription has expired. Please renew to continue using the system.",
        messageAr: "انتهى اشتراكك. يرجى التجديد لمواصلة استخدام النظام.",
        code: "SUBSCRIPTION_EXPIRED",
        redirectTo: "/subscription",
      });
    }

    // التحقق من قرب انتهاء الاشتراك
    const daysRemaining = Math.ceil(
      (activeSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    // إضافة معلومات الاشتراك إلى request
    request.subscription = {
      ...activeSubscription,
      daysRemaining,
    };

    // إذا كان الاشتراك ينتهي قريباً، نضيف تحذير في header
    if (daysRemaining <= 7) {
      reply.header(
        "X-Subscription-Warning",
        `Expires in ${daysRemaining} days`
      );
    }
  } catch (error) {
    console.error("Subscription check error:", error);
    throw new AppError("Error checking subscription status", 500);
  }
}

/**
 * Middleware للتحقق من الاشتراك بشكل خفيف (لا يمنع الوصول)
 * يضيف فقط معلومات الاشتراك إلى request
 */
export async function checkSubscriptionInfo(request, reply) {
  const user = request.user;

  if (user.role === "developer" || !user.companyId) {
    request.subscription = null;
    return;
  }

  try {
    const activeSubscription =
      await request.server.prisma.subscription.findFirst({
        where: {
          companyId: user.companyId,
          status: "active",
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          plan: true,
        },
      });

    if (activeSubscription) {
      const daysRemaining = Math.ceil(
        (activeSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      request.subscription = {
        ...activeSubscription,
        daysRemaining,
      };

      if (daysRemaining <= 7) {
        reply.header(
          "X-Subscription-Warning",
          `Expires in ${daysRemaining} days`
        );
      }
    } else {
      request.subscription = null;
    }
  } catch (error) {
    console.error("Subscription info check error:", error);
    request.subscription = null;
  }
}
