// ==========================================
// subscriptions.repository.js
// ==========================================

// ==========================================
// Subscription Plans
// ==========================================

export const findAllPlans = async (prisma) => {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
};

export const findPlanById = async (prisma, id) => {
  return prisma.subscriptionPlan.findUnique({
    where: { id },
  });
};

// ==========================================
// Company Subscriptions
// ==========================================

/**
 * FIXED: Find active subscription
 * Returns subscription where:
 * 1. companyId matches
 * 2. status = "active"
 * 3. endDate >= NOW (not expired yet)
 */
export const findActiveSubscription = async (prisma, companyId) => {
  const now = new Date();

  const subscription = await prisma.subscription.findFirst({
    where: {
      companyId,
      status: "active",
      endDate: {
        gte: now,
      },
    },
    include: {
      plan: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true,        
        }
      },
      alerts: {
        where: { isRead: false },
        orderBy: { sentAt: "desc" },
      },
    },
    orderBy: { endDate: "desc" }, //  Get the latest one
  });

  if (!subscription) return null;

  return subscription;
};

export const findCompanySubscriptions = async (prisma, companyId) => {
  return prisma.subscription.findMany({
    where: { companyId },
    include: {
      plan: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createSubscription = async (prisma, data) => {
  return prisma.subscription.create({
    data,
    include: {
      plan: true,
    },
  });
};

export const updateSubscription = async (prisma, id, data) => {
  return prisma.subscription.update({
    where: { id },
    data,
    include: {
      plan: true,
    },
  });
};

export const cancelSubscription = async (prisma, id, reason) => {
  return prisma.subscription.update({
    where: { id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });
};

// ==========================================
// Subscription Invoices
// ==========================================

export const createInvoice = async (prisma, data) => {
  return prisma.subscriptionInvoice.create({
    data,
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });
};

export const findInvoiceById = async (prisma, id) => {
  return prisma.subscriptionInvoice.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });
};

export const findInvoiceByStripeSession = async (prisma, sessionId) => {
  return prisma.subscriptionInvoice.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      company: true,
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });
};

export const updateInvoicePaymentStatus = async (prisma, id, data) => {
  return prisma.subscriptionInvoice.update({
    where: { id },
    data,
  });
};

export const findCompanyInvoices = async (prisma, companyId) => {
  return prisma.subscriptionInvoice.findMany({
    where: { companyId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          logo: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};

// ==========================================
// Subscription Alerts
// ==========================================

export const createAlert = async (prisma, data) => {
  return prisma.subscriptionAlert.create({
    data,
  });
};

export const findUnreadAlerts = async (prisma, subscriptionId) => {
  return prisma.subscriptionAlert.findMany({
    where: {
      subscriptionId,
      isRead: false,
    },
    orderBy: { sentAt: "desc" },
  });
};

export const markAlertsAsRead = async (prisma, alertIds) => {
  return prisma.subscriptionAlert.updateMany({
    where: {
      id: { in: alertIds },
    },
    data: {
      isRead: true,
    },
  });
};

export const findCompanyAlerts = async (prisma, companyId) => {
  return prisma.subscriptionAlert.findMany({
    where: {
      subscription: {
        companyId,
      },
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
    take: 10,
  });
};

// ==========================================
// Subscription Expiry Checks
// ==========================================

export const findExpiringSoonSubscriptions = async (prisma, days) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.subscription.findMany({
    where: {
      status: "active",
      endDate: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      plan: true,
    },
  });
};

export const findExpiredSubscriptions = async (prisma) => {
  return prisma.subscription.findMany({
    where: {
      status: "active",
      endDate: {
        lt: new Date(),
      },
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const markSubscriptionsAsExpired = async (prisma, subscriptionIds) => {
  return prisma.subscription.updateMany({
    where: {
      id: { in: subscriptionIds },
    },
    data: {
      status: "expired",
    },
  });
};

// ==========================================
// Statistics
// ==========================================

export const getSubscriptionStats = async (prisma) => {
  const [active, expired, cancelled, totalRevenue] = await Promise.all([
    prisma.subscription.count({
      where: { status: "active" },
    }),
    prisma.subscription.count({
      where: { status: "expired" },
    }),
    prisma.subscription.count({
      where: { status: "cancelled" },
    }),
    prisma.subscriptionInvoice.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { amount: true },
    }),
  ]);

  return {
    active,
    expired,
    cancelled,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
};
