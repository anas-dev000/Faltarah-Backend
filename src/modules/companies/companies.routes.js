// ==========================================
// companies.routes.js
// ==========================================

import * as companyController from "./companies.controller.js";
import {
  createCompanySchema,
  updateCompanySchema,
  updateSubscriptionSchema,
} from "./companies.schema.js";
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

export default async function companyRoutes(fastify) {
  // ========================================
  // Protected Routes - Company Management
  // ========================================

  // Get all companies (All authenticated users can see companies based on their role)
  fastify.get("/", {
    preHandler: [authenticate],
    handler: companyController.getAll,
  });

  // Get company by ID (All authenticated users - with permission checks in the service)
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: companyController.getById,
  });

  // Create a new company (Developer only)
  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["developer"]),
      validateBody(createCompanySchema),
    ],
    handler: companyController.create,
  });

  // Update company (Manager can update their own company, Developer can update any)
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      // validateBody(updateCompanySchema),
    ],
    handler: companyController.update,
  });

  // Update company subscription expiry date (Developer only)
  fastify.put("/:id/subscription", {
    preHandler: [
      authenticate,
      authorize(["developer"]),
      validateBody(updateSubscriptionSchema),
    ],
    handler: companyController.updateSubscription,
  });

  // Delete company (Developer only)
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["developer"])],
    handler: companyController.deleteById,
  });
}
