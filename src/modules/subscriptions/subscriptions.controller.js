// ==========================================
// subscriptions.controller.js
// ==========================================

import * as subService from "./subscriptions.service.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  // إذا كان developer وأرسل companyId في query
  if (currentUser.role === "developer" && request.query.companyId) {
    companyId = Number(request.query.companyId);
  } else {
    // Manager أو Employee يحصل على بيانات شركته فقط
    companyId = currentUser.companyId;
  }

  const status = await subService.getCompanySubscriptionStatus(
    request.server.prisma,
    companyId
  );

  return reply.send({
    success: true,
    data: status,
  });
};

// ==========================================
// Create Stripe Checkout Session
// ==========================================
export const createCheckoutSession = async (request, reply) => {
  const currentUser = request.user;
  const { planId } = request.body;

  let companyId;

  // Developer يمكنه إنشاء اشتراك لأي شركة
  if (currentUser.role === "developer" && request.body.companyId) {
    companyId = Number(request.body.companyId);
  } else {
    // Manager يشتري لشركته فقط
    companyId = currentUser.companyId;
  }

  const result = await subService.createCheckoutSession(
    request.server.prisma,
    companyId,
    Number(planId),
    currentUser
  );

  return reply.send({
    success: true,
    data: result,
  });
};

// ==========================================
// Handle Stripe Webhook
// ==========================================
export const handleStripeWebhook = async (request, reply) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return reply.status(400).send({
      success: false,
      error: `Webhook Error: ${err.message}`,
    });
  }

  const result = await subService.handleStripeWebhook(
    request.server.prisma,
    event
  );

  return reply.send({
    success: true,
    data: result,
  });
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

  // Developer لا يحتاج للتحقق من الاشتراك
  if (currentUser.role === "developer") {
    return reply.send({
      success: true,
      needsSubscription: false,
      isExpired: false,
    });
  }

  const status = await subService.getCompanySubscriptionStatus(
    request.server.prisma,
    currentUser.companyId
  );

  const needsSubscription = status.status === "expired";
  const daysRemaining = status.daysRemaining;

  return reply.send({
    success: true,
    needsSubscription,
    isExpired: needsSubscription,
    daysRemaining,
    expiryDate: status.expiryDate,
    currentSubscription: status.currentSubscription,
  });
};
