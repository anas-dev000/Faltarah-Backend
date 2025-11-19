// ==========================================
// subscriptions.routes.js
// ==========================================

import * as subController from "./subscriptions.controller.js";
import {
  processCashPaymentSchema,
  validateCheckoutRequest,
  cancelSubscriptionSchema,
  markAlertsReadSchema,
} from "./subscriptions.schema.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";

const validateBody = (schema) => {
  return async (request, reply) => {
    const validation = validateSchema(request.body, schema);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation Error",
        details: validation.errors,
      });
    }
  };
};

export default async function subscriptionRoutes(fastify) {
  // ========================================
  // Public Routes
  // ========================================

  // Get all subscription plans (public for viewing)
  fastify.get("/plans", {
    handler: subController.getAllPlans,
  });

  // Get plan by ID
  fastify.get("/plans/:id", {
    handler: subController.getPlanById,
  });

  // ========================================
  // Stripe Webhook (No auth - validated by Stripe signature)
  // ========================================
  fastify.post("/webhook", {
    config: {
      // Important: Disable body parsing for webhook
      rawBody: true,
    },
    handler: subController.handleStripeWebhook,
  });

  // ========================================
  // Protected Routes
  // ========================================

  // Get company subscription status
  fastify.get("/status", {
    preHandler: [authenticate],
    handler: subController.getCompanyStatus,
  });

  // Get verification status (for middleware redirects)
  fastify.get("/verification-status", {
    preHandler: [authenticate],
    handler: subController.getVerificationStatus,
  });

  // Create Stripe checkout session
  fastify.post("/checkout", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateCheckoutRequest, // Custom validation
    ],
    handler: subController.createCheckoutSession,
  });

  // Process cash payment (Developer only)
  fastify.post("/cash-payment", {
    preHandler: [
      authenticate,
      authorize(["developer"]),
      validateBody(processCashPaymentSchema),
    ],
    handler: subController.processCashPayment,
  });

  // Cancel subscription
  fastify.post("/:id/cancel", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(cancelSubscriptionSchema),
    ],
    handler: subController.cancelSubscription,
  });

  // Mark alerts as read
  fastify.post("/alerts/read", {
    preHandler: [authenticate, validateBody(markAlertsReadSchema)],
    handler: subController.markAlertsRead,
  });
}
