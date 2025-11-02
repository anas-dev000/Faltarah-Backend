// ==========================================
// users.routes.js
// ==========================================

import * as userController from "./users.controller.js";
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
} from "./users.schema.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";

const validateBody = (schema) => {
  return async (request, reply) => {
    const validation = validateSchema(request.body, schema);

    if (!validation.valid) {
      return reply.status(400).send({
        error: "Validation Error",
        details: validation.errors,
      });
    }
  };
};

export default async function userRoutes(fastify) {
  // Public: Login
  fastify.post("/login", {
    preHandler: [validateBody(loginSchema)],
    handler: userController.login,
  });

  // Protected: Get all users
  fastify.get("/", {
    preHandler: [authenticate],
    handler: userController.getAll,
  });

  // Protected: Get user by id
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: userController.getById,
  });

  // Protected: Create user
  fastify.post("/", {
    preHandler: [authenticate, validateBody(createUserSchema)],
    handler: userController.create,
  });

  // Protected: Update user
  fastify.put("/:id", {
    preHandler: [authenticate, validateBody(updateUserSchema)],
    handler: userController.update,
  });

  // Protected: Delete user
  fastify.delete("/:id", {
    preHandler: [authenticate],
    handler: userController.deleteById,
  });
}
