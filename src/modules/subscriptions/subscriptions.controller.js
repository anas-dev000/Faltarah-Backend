// ==========================================
// subscriptions.controller.js
// ==========================================

import * as subService from "./subscriptions.service.js";
import Stripe from "stripe";
import { config } from "../../config/env.js";

const stripe = new Stripe(config.stripe.secretKey);

// ==========================================
// Get All Plans
// ==========================================
export const getAllPlans = async (request, reply) => {
  const plans = await subService.getAllPlans(request.server.prisma);

  return reply.send({
    success: true,
    data: plans,
    count: plans.length,
  });
};

// ==========================================
// Get Plan by ID
// ==========================================
export const getPlanById = async (request, reply) => {
  const { id } = request.params;

  const plan = await subService.getPlanById(request.server.prisma, Number(id));

  return reply.send({
    success: true,
    data: plan,
  });
};

// ==========================================
// Get Company Subscription Status
// ==========================================
export const getCompanyStatus = async (request, reply) => {
  const currentUser = request.user;
  let companyId;

  if (currentUser.role === "developer" && request.query.companyId) {
    companyId = Number(request.query.companyId);
  } else {
    companyId = currentUser.companyId;
  }

  try {
    const status = await subService.getCompanySubscriptionStatus(
      request.server.prisma,
      companyId
    );

    // ✅ Return with proper structure
    return reply.send({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("❌ Status error:", error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Subscription Statistics (Developer Only)
 */
export const getSubscriptionStats = async (request, reply) => {
  const currentUser = request.user;

  // Only developer can access
  if (currentUser.role !== 'developer') {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden: Only developers can view subscription stats'
    });
  }

  try {
    const { month, year } = request.query;
    
    const stats = await subService.getSubscriptionStatistics(
      request.server.prisma,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    return reply.send({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Monthly Revenue Report (Developer Only)
 */
export const getMonthlyRevenue = async (request, reply) => {
  const currentUser = request.user;

  if (currentUser.role !== 'developer') {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden: Only developers can view revenue reports'
    });
  }

  try {
    const { year } = request.query;
    
    const report = await subService.getMonthlyRevenueReport(
      request.server.prisma,
      year ? parseInt(year) : new Date().getFullYear()
    );

    return reply.send({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('❌ Revenue report error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message
    });
  }
};
// ==========================================
// Create Stripe Checkout Session
// ==========================================
export const createCheckoutSession = async (request, reply) => {
  const currentUser = request.user;
  const { planId, companyId: requestCompanyId } = request.body;

  // ✅ Strict validation
  if (!planId) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: { planId: "Plan ID is required" },
    });
  }

  if (typeof planId !== "number") {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: {
        planId: `Plan ID must be a number, received ${typeof planId}`,
      },
    });
  }

  if (planId <= 0) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: { planId: "Plan ID must be positive" },
    });
  }

  let companyId;

  // Developer can create for any company
  if (currentUser.role === "developer" && requestCompanyId) {
    companyId = Number(requestCompanyId);
  } else if (currentUser.role === "manager") {
    // Manager creates for their own company
    companyId = currentUser.companyId;
  } else {
    return reply.status(403).send({
      success: false,
      error: "Only managers and developers can create subscriptions",
    });
  }

  if (!companyId) {
    return reply.status(400).send({
      success: false,
      error: "Company ID is required",
    });
  }

  try {

    const result = await subService.createCheckoutSession(
      request.server.prisma,
      companyId,
      Number(planId),
      currentUser
    );


    // ✅ Return with proper structure
    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
};

// ==========================================
// Handle Stripe Webhook
// ==========================================
export const handleStripeWebhook = async (request, reply) => {
  const sig = request.headers["stripe-signature"];
  // ✅ Use rawBody instead of body
  const rawBody = request.rawBody || request.body;

  let event;

  try {
    // ✅ For development: Increase tolerance window
    const webhookOptions = {
      tolerance: 600, // 10 minutes tolerance for development
    };

    if (config.nodeEnv === "development") {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        config.stripe.webhookSecret,
        webhookOptions // Pass options for development
      );
    } else {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        config.stripe.webhookSecret
      );
    }

  } catch (err) {
    console.error("❌ Webhook verification failed:", {
      error: err.message,
      errorType: err.type,
      signature: sig?.substring(0, 50) + "...",
      webhookSecret: config.stripe.webhookSecret?.substring(0, 15) + "...",
      bodyPreview:
        typeof rawBody === "string"
          ? rawBody.substring(0, 100) + "..."
          : "Not a string",
    });
    return reply.status(400).send({
      success: false,
      error: `Webhook Error: ${err.message}`,
    });
  }

  // Process the event
  try {
    const result = await subService.handleStripeWebhook(
      request.server.prisma,
      event
    );

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

// ==========================================
// Process Cash Payment (Developer Only)
// ==========================================
export const processCashPayment = async (request, reply) => {
  const currentUser = request.user;
  const { companyId, planId, notes } = request.body;

  const result = await subService.processCashPayment(
    request.server.prisma,
    Number(companyId),
    Number(planId),
    notes,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Cash payment processed successfully",
    data: result,
  });
};

// ==========================================
// Cancel Subscription
// ==========================================
export const cancelSubscription = async (request, reply) => {
  const currentUser = request.user;
  const { id } = request.params;
  const { reason } = request.body;

  const subscription = await subService.cancelCompanySubscription(
    request.server.prisma,
    Number(id),
    reason,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Subscription cancelled successfully",
    data: subscription,
  });
};

// ==========================================
// Mark Alerts as Read
// ==========================================
export const markAlertsRead = async (request, reply) => {
  const currentUser = request.user;
  const { alertIds } = request.body;

  await subService.markAlertsRead(request.server.prisma, alertIds, currentUser);

  return reply.send({
    success: true,
    message: "Alerts marked as read",
  });
};

// ==========================================
// Get Verification Status (for redirects)
// ==========================================
export const getVerificationStatus = async (request, reply) => {
  const currentUser = request.user;

  // ✅ Developer never needs subscription
  if (currentUser.role === "developer") {
    return reply.send({
      success: true,
      data: {
        needsSubscription: false,
        isExpired: false,
        hasActiveSubscription: true,
      },
    });
  }

  try {
    const status = await subService.getCompanySubscriptionStatus(
      request.server.prisma,
      currentUser.companyId
    );

    const isExpired = status.status === "expired";
    const needsSubscription = isExpired;

    return reply.send({
      success: true,
      data: {
        needsSubscription,
        status: status.status,
        isExpired,
        daysRemaining: status.daysRemaining,
        expiryDate: status.expiryDate,
        currentSubscription: status.currentSubscription,
        hasActiveSubscription: !isExpired,
      },
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
};
