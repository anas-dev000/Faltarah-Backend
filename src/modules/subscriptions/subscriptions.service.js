// ==========================================
// subscriptions.service.js
// ==========================================

import * as subRepo from "./subscriptions.repository.js";
import * as companyRepo from "../companies/companies.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import Stripe from "stripe";
import { config } from "../../config/env.js";
import {
  sendSubscriptionConfirmationEmail,
  sendSubscriptionExpiryWarningEmail,
  sendSubscriptionExpiredEmail,
} from "../../shared/utils/email.service.js";

const stripe = new Stripe(config.stripe.secretKey);

// ==========================================
// Subscription Plans
// ==========================================

export const getAllPlans = async (prisma) => {
  return subRepo.findAllPlans(prisma);
};

export const getPlanById = async (prisma, planId) => {
  const plan = await subRepo.findPlanById(prisma, planId);

  if (!plan) {
    throw new AppError("Subscription plan not found", 404);
  }

  return plan;
};

// ==========================================
// Company Subscription Status
// ==========================================

export const getCompanySubscriptionStatus = async (prisma, companyId) => {
  const company = await companyRepo.findCompanyById(prisma, companyId);

  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const activeSubscription = await subRepo.findActiveSubscription(
    prisma,
    companyId
  );

  const allSubscriptions = await subRepo.findCompanySubscriptions(
    prisma,
    companyId
  );

  const invoices = await subRepo.findCompanyInvoices(prisma, companyId);
  const alerts = await subRepo.findCompanyAlerts(prisma, companyId);

  let status = "expired";
  let daysRemaining = 0;
  let expiryDate = null;

  if (activeSubscription) {
    // Check if there's a VALID active subscription
    expiryDate = new Date(activeSubscription.endDate);
    const now = new Date();

    // ✅ Calculate days remaining
    const timeDiff = expiryDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // ✅ Calculate status
    // ONLY set status to "active" if:
    // 1. endDate is in the future
    // 2. daysRemaining > 0
    // 3. subscription status is "active"
    if (
      daysRemaining > 0 &&
      expiryDate > now &&
      activeSubscription.status === "active"
    ) {
      status = "active";
    } else {
      status = "expired";
      daysRemaining = 0;
    }
  }

  return {
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      logo: company.logo,
    },
    status,
    currentSubscription: activeSubscription,
    daysRemaining,
    expiryDate,
    subscriptionHistory: allSubscriptions,
    invoices,
    unreadAlerts: alerts.filter((a) => !a.isRead),
    alertsHistory: alerts,
  };
};


/**
 * Get Subscription Statistics
 */
export const getSubscriptionStatistics = async (prisma, month = null, year = null) => {
  const now = new Date();
  const currentMonth = month || now.getMonth() + 1;
  const currentYear = year || now.getFullYear();

  // Start and end of the specified month
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // Total revenue this month
  const monthlyRevenue = await prisma.subscriptionInvoice.aggregate({
    where: {
      paymentStatus: 'paid',
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      amount: true
    },
    _count: true
  });

  // Total revenue this year
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  const yearlyRevenue = await prisma.subscriptionInvoice.aggregate({
    where: {
      paymentStatus: 'paid',
      paidAt: {
        gte: yearStart,
        lte: yearEnd
      }
    },
    _sum: {
      amount: true
    },
    _count: true
  });

  // Active subscriptions count (non-trial)
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      status: 'active',
      endDate: {
        gte: now
      },
      plan: {
        name: {
          not: 'Trial'
        }
      }
    }
  });

  // Expired subscriptions count
  const expiredSubscriptions = await prisma.subscription.count({
    where: {
      status: 'expired'
    }
  });

  // ✅ Trial companies count
  const trialCompanies = await prisma.subscription.count({
    where: {
      status: 'active',
      endDate: {
        gte: now
      },
      plan: {
        name: 'Trial'
      }
    }
  });

  // ✅ NEW: Subscriptions expiring soon (within 7 days)
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: 'active',
      endDate: {
        gte: now,
        lte: sevenDaysFromNow
      }
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true
        }
      },
      plan: true
    },
    orderBy: {
      endDate: 'asc'
    }
  });

  // ✅ Calculate days remaining for each expiring subscription
  const expiringSoonWithDays = expiringSoon.map(sub => {
    const endDate = new Date(sub.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return {
      ...sub,
      daysRemaining: Math.max(0, daysRemaining)
    };
  });

  // ✅ NEW: Expired subscriptions that weren't renewed
  const expiredNotRenewed = await prisma.subscription.findMany({
    where: {
      status: 'expired',
      endDate: {
        lt: now
      }
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true
        }
      },
      plan: true
    },
    orderBy: {
      endDate: 'desc'
    },
    take: 20
  });

  // ✅ Recent active subscriptions (all plans)
  const recentSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      endDate: {
        gte: now
      }
    },
    take: 50, // Increased to allow filtering by plan
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true
        }
      },
      plan: true
    }
  });

  // ✅ Group recent subscriptions by plan
  const subscriptionsByPlan = {
    all: recentSubscriptions,
    monthly: recentSubscriptions.filter(s => s.plan.name === 'Monthly'),
    quarterly: recentSubscriptions.filter(s => s.plan.name === 'Quarterly'),
    yearly: recentSubscriptions.filter(s => s.plan.name === 'Yearly')
  };
    // ✅ NEW: جلب الشركات التجريبية (Trial) بالتفاصيل
  const trialSubscriptionsRaw = await prisma.subscription.findMany({
    where: {
      status: 'active',
      endDate: { gte: now },
      plan: { name: 'Trial' }
    },
    include: {
      company: {
        select: { id: true, name: true, email: true, logo: true }
      },
      plan: true
    },
    orderBy: { endDate: 'asc' }
  });

  // حساب الأيام المتبقية لكل شركة تجريبية
  const trialSubscriptions = trialSubscriptionsRaw.map(sub => {
    const endDate = new Date(sub.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return {
      ...sub,
      daysRemaining: Math.max(0, daysRemaining)
    };
  });
  return {
    period: {
      month: currentMonth,
      year: currentYear,
      monthName: new Date(currentYear, currentMonth - 1).toLocaleString('ar-EG', { month: 'long' })
    },
    monthly: {
      revenue: monthlyRevenue._sum.amount || 0,
      invoicesCount: monthlyRevenue._count
    },
    yearly: {
      revenue: yearlyRevenue._sum.amount || 0,
      invoicesCount: yearlyRevenue._count
    },
    subscriptions: {
      active: activeSubscriptions,
      expired: expiredSubscriptions,
      trial: trialCompanies
    },
    recent: recentSubscriptions,
    recentByPlan: subscriptionsByPlan, // ✅ NEW: Grouped by plan
    expiringSoon: expiringSoonWithDays, // ✅ NEW: With days remaining
    expiredNotRenewed: expiredNotRenewed, // ✅ NEW: Expired & not renewed
    trialSubscriptions: trialSubscriptions
  };
};

/**
 * Get Monthly Revenue Report for the whole year
 */
export const getMonthlyRevenueReport = async (prisma, year) => {
  const monthlyData = [];

  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const monthRevenue = await prisma.subscriptionInvoice.aggregate({
      where: {
        paymentStatus: 'paid',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    monthlyData.push({
      month,
      monthName: new Date(year, month - 1).toLocaleString('ar-EG', { month: 'long' }),
      revenue: monthRevenue._sum.amount || 0,
      invoicesCount: monthRevenue._count
    });
  }

  const totalYearRevenue = monthlyData.reduce((sum, m) => sum + parseFloat(m.revenue), 0);

  return {
    year,
    months: monthlyData,
    totalRevenue: totalYearRevenue
  };
};


// ==========================================
// Create Stripe Checkout Session
// ==========================================

export const createCheckoutSession = async (
  prisma,
  companyId,
  planId,
  currentUser
) => {
  // التحقق من الصلاحية
  if (currentUser.role !== "manager" && currentUser.role !== "developer") {
    throw new AppError("Only managers can purchase subscriptions", 403);
  }

  if (currentUser.role === "manager" && currentUser.companyId !== companyId) {
    throw new AppError("You can only purchase for your own company", 403);
  }

  if (!companyId || typeof companyId !== "number") {
    throw new AppError("Invalid company ID", 400);
  }

  if (!planId || typeof planId !== "number") {
    throw new AppError("Invalid plan ID", 400);
  }

  const company = await companyRepo.findCompanyById(prisma, companyId);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const plan = await subRepo.findPlanById(prisma, planId);
  if (!plan || !plan.isActive) {
    throw new AppError("Invalid or inactive plan", 400);
  }

  // إنشاء فاتورة مؤقتة
  const invoice = await subRepo.createInvoice(prisma, {
    companyId,
    planName: plan.name,
    amount: plan.price,
    durationDays: plan.durationDays,
    paymentMethod: "stripe",
    paymentStatus: "pending",
  });

  // Create Stripe Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (config.stripe.currency || "egp").toLowerCase(),
            product_data: {
              name: `${plan.nameAr} - ${plan.name}`,
              description: plan.descriptionAr || plan.description,
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.frontend.url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontend.url}/subscription/cancel`,
      client_reference_id: invoice.id.toString(),
      metadata: {
        companyId: companyId.toString(),
        planId: planId.toString(),
        invoiceId: invoice.id.toString(),
      },
    });

    await subRepo.updateInvoicePaymentStatus(prisma, invoice.id, {
      stripeSessionId: session.id,
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
      invoice,
    };
  } catch (error) {
    console.error("Stripe error:", error);
    throw new AppError(error.message || "Failed to create Stripe session", 500);
  }
};

// ==========================================
// Handle Stripe Webhook
// ==========================================

export const handleStripeWebhook = async (prisma, event) => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const invoice = await subRepo.findInvoiceByStripeSession(
      prisma,
      session.id
    );

    if (!invoice) {
      throw new AppError("Invoice not found for this session", 404);
    }

    // تحديث حالة الدفع
    await subRepo.updateInvoicePaymentStatus(prisma, invoice.id, {
      paymentStatus: "paid",
      stripePaymentId: session.payment_intent,
      paidAt: new Date(),
    });

    // الحصول على الاشتراك النشط الحالي
    const currentSubscription = await subRepo.findActiveSubscription(
      prisma,
      invoice.companyId
    );

    const plan = await subRepo.findPlanById(
      prisma,
      parseInt(session.metadata.planId)
    );

    let startDate = new Date();

    // إذا كان هناك اشتراك نشط، نبدأ من تاريخ انتهائه
    if (currentSubscription && currentSubscription.endDate > new Date()) {
      startDate = new Date(currentSubscription.endDate);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // إنشاء اشتراك جديد
    const subscription = await subRepo.createSubscription(prisma, {
      companyId: invoice.companyId,
      planId: plan.id,
      status: "active",
      startDate,
      endDate,
    });

    // ✅ تحديث subscriptionExpiryDate في جدول الشركات
    await companyRepo.updateCompany(prisma, invoice.companyId, {
      subscriptionExpiryDate: endDate,
    });

    // ربط الفاتورة بالاشتراك
    await subRepo.updateInvoicePaymentStatus(prisma, invoice.id, {
      subscriptionId: subscription.id,
    });

    // إرسال بريد تأكيد
    const company = await companyRepo.findCompanyById(
      prisma,
      invoice.companyId
    );
    if (company.email) {
      await sendSubscriptionConfirmationEmail(
        company.email,
        company.name,
        plan.nameAr,
        startDate,
        endDate
      );
    }

    return { success: true, subscription };
  }

  return { success: false };
};

// ==========================================
// Manual Cash Payment
// ==========================================

export const processCashPayment = async (
  prisma,
  companyId,
  planId,
  notes,
  currentUser
) => {
  // فقط developer يمكنه تأكيد الدفع النقدي
  if (currentUser.role !== "developer") {
    throw new AppError("Only developers can confirm cash payments", 403);
  }

  const company = await companyRepo.findCompanyById(prisma, companyId);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const plan = await subRepo.findPlanById(prisma, planId);
  if (!plan || !plan.isActive) {
    throw new AppError("Invalid or inactive plan", 400);
  }

  // إنشاء فاتورة مدفوعة
  const invoice = await subRepo.createInvoice(prisma, {
    companyId,
    planName: plan.name,
    amount: plan.price,
    durationDays: plan.durationDays,
    paymentMethod: "cash",
    paymentStatus: "paid",
    paidAt: new Date(),
    notes: notes || "Manual cash payment confirmed by developer",
  });

  // الحصول على الاشتراك النشط الحالي
  const currentSubscription = await subRepo.findActiveSubscription(
    prisma,
    companyId
  );

  let startDate = new Date();

  if (currentSubscription && currentSubscription.endDate > new Date()) {
    startDate = new Date(currentSubscription.endDate);
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // إنشاء اشتراك جديد
  const subscription = await subRepo.createSubscription(prisma, {
    companyId,
    planId: plan.id,
    status: "active",
    startDate,
    endDate,
  });

  // ✅ تحديث subscriptionExpiryDate في جدول الشركات
  await companyRepo.updateCompany(prisma, companyId, {
    subscriptionExpiryDate: endDate,
  });

  // ربط الفاتورة بالاشتراك
  await subRepo.updateInvoicePaymentStatus(prisma, invoice.id, {
    subscriptionId: subscription.id,
  });

  // إرسال بريد تأكيد
  if (company.email) {
    await sendSubscriptionConfirmationEmail(
      company.email,
      company.name,
      plan.nameAr,
      startDate,
      endDate
    );
  }

  return {
    success: true,
    subscription,
    invoice,
  };
};

// ==========================================
// Cancel Subscription
// ==========================================

export const cancelCompanySubscription = async (
  prisma,
  subscriptionId,
  reason,
  currentUser
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { company: true },
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  // التحقق من الصلاحية
  if (
    currentUser.role === "manager" &&
    currentUser.companyId !== subscription.companyId
  ) {
    throw new AppError(
      "You can only cancel your own company subscription",
      403
    );
  }

  return subRepo.cancelSubscription(prisma, subscriptionId, reason);
};

// ==========================================
// Mark Alerts as Read
// ==========================================

export const markAlertsRead = async (prisma, alertIds, currentUser) => {
  return subRepo.markAlertsAsRead(prisma, alertIds);
};

// ==========================================
// Check and Send Expiry Alerts (CRON Job)
// ==========================================

export const checkAndSendExpiryAlerts = async (prisma) => {
  const alertConfigs = [
    {
      days: 7,
      type: "expiry_7days",
      messageEn: "Your subscription expires in 7 days",
      messageAr: "اشتراكك ينتهي خلال 7 أيام",
    },
    {
      days: 3,
      type: "expiry_3days",
      messageEn: "Your subscription expires in 3 days",
      messageAr: "اشتراكك ينتهي خلال 3 أيام",
    },
    {
      days: 1,
      type: "expiry_1day",
      messageEn: "Your subscription expires tomorrow",
      messageAr: "اشتراكك ينتهي غداً",
    },
  ];

  for (const config of alertConfigs) {
    const subscriptions = await subRepo.findExpiringSoonSubscriptions(
      prisma,
      config.days
    );

    for (const subscription of subscriptions) {
      // التحقق من عدم إرسال نفس التنبيه مرتين
      const existingAlert = await prisma.subscriptionAlert.findFirst({
        where: {
          subscriptionId: subscription.id,
          alertType: config.type,
        },
      });

      if (!existingAlert) {
        // إنشاء التنبيه
        await subRepo.createAlert(prisma, {
          subscriptionId: subscription.id,
          alertType: config.type,
          message: config.messageEn,
          messageAr: config.messageAr,
        });

        // إرسال بريد إلكتروني
        if (subscription.company.email) {
          await sendSubscriptionExpiryWarningEmail(
            subscription.company.email,
            subscription.company.name,
            subscription.endDate,
            config.days
          );
        }
      }
    }
  }

  return { success: true };
};

// ==========================================
// Mark Expired Subscriptions (CRON Job)
// ==========================================

export const markExpiredSubscriptions = async (prisma) => {
  const expired = await subRepo.findExpiredSubscriptions(prisma);

  if (expired.length > 0) {
    const subscriptionIds = expired.map((s) => s.id);
    await subRepo.markSubscriptionsAsExpired(prisma, subscriptionIds);

    // إرسال بريد انتهاء الاشتراك
    for (const subscription of expired) {
      // إنشاء تنبيه
      await subRepo.createAlert(prisma, {
        subscriptionId: subscription.id,
        alertType: "expired",
        message: "Your subscription has expired",
        messageAr: "انتهى اشتراكك",
      });

      if (subscription.company.email) {
        await sendSubscriptionExpiredEmail(
          subscription.company.email,
          subscription.company.name
        );
      }
    }
  }

  return {
    success: true,
    expiredCount: expired.length,
  };
};
