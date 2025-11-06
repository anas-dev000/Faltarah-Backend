// ==========================================
// customers.routes.js
// ==========================================

import * as customerController from "./customers.controller.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.schema.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";

/**
 * Helper for validating request body against schema
 */
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

export default async function customerRoutes(fastify) {
  // ========================================
  // Protected Routes - Customer Management
  // ========================================

  // Get all customers (Manager, Developer only)
  fastify.get("/", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: customerController.getAll,
  });

  // Get customer by ID (available to all authenticated users)
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: customerController.getById,
  });

  // Get customers by type (Installation / Maintenance)
  fastify.get("/type/:customerType", {
    preHandler: [authenticate],
    handler: customerController.getByType,
  });

  // Get all governorates
  fastify.get("/governorates", {
    preHandler: [authenticate],
    handler: customerController.getGovernorates,
  });

  // Get cities by governorate
  fastify.get("/cities/:governorate", {
    preHandler: [authenticate],
    handler: customerController.getCitiesByGovernorate,
  });

  // Get customer count (Manager, Developer only)
  fastify.get("/count", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: customerController.getCount,
  });

  // Create a new customer (Manager, Developer only)
  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
    ],
    handler: customerController.create,
  });

  // Update existing customer (Manager, Developer only)
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(updateCustomerSchema),
    ],
    handler: customerController.update,
  });

  // Delete customer (Developer only)
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["developer"])],
    handler: customerController.deleteById,
  });
}
