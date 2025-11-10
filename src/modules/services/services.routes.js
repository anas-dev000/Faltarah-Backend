import * as serviceController from "./services.controller.js";
import { createServiceSchema, updateServiceSchema } from "./services.schema.js";
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

export default async function serviceRoutes(fastify) {
  // ========================================
  // Protected Routes - Service Management
  // ========================================

  fastify.get("/", {
    preHandler: [authenticate],
    handler: serviceController.getAll,
  });

  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: serviceController.getById,
  });

  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(createServiceSchema),
    ],
    handler: serviceController.create,
  });

  fastify.put("/:id", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(updateServiceSchema),
    ],
    handler: serviceController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["developer","manager"])],
    handler: serviceController.deleteById,
  });
}
