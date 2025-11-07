import * as supplierController from "./suppliers.controller.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./suppliers.schema.js";
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

export default async function supplierRoutes(fastify) {
  // ========================================
  // Protected Routes - Supplier Management
  // ========================================

  // Get all suppliers (Manager, Developer, Employee)
  fastify.get("/", {
    preHandler: [authenticate],
    handler: supplierController.getAll,
  });

  // Get supplier by ID (All authenticated users with company access)
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: supplierController.getById,
  });

  // Create new supplier (Manager, Developer only)
  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(createSupplierSchema),
    ],
    handler: supplierController.create,
  });

  // Update supplier (Manager, Developer only)
  fastify.put("/:id", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(updateSupplierSchema),
    ],
    handler: supplierController.update,
  });

  // Delete supplier (Manager, Developer only)
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: supplierController.deleteById,
  });
}