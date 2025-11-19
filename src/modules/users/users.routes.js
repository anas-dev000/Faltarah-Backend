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

export default async function userRoutes(fastify) {
  // ========================================
  // Public Routes
  // ========================================

  fastify.post("/login", {
    preHandler: [validateBody(loginSchema)],
    handler: userController.login,
  });

  // ========================================
  // Protected Routes - Profile Management
  // ========================================

  // Retrieve the current user's profile (available to all users)
  fastify.get("/profile", {
    preHandler: [authenticate],
    handler: userController.getProfile,
  });

  // Update the current user's profile (available to all users)
  fastify.put("/profile", {
    preHandler: [authenticate, validateBody(updateUserSchema)],
    handler: userController.updateProfile,
  });

  // Log out (available to all users)
  fastify.post("/logout", {
    preHandler: [authenticate],
    handler: userController.logout,
  });

  // ========================================
  // Protected Routes - User Management
  // ========================================

  // Get all users (Manager, Developer only)
 fastify.get("/", {
  preHandler: [authenticate, authorize(["manager", "developer"])],
  schema: {
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      },
    },
  },
  handler: userController.getAll,
});

  // Get a user by ID (all users - with permission checks in the service)
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: userController.getById,
  });

  // Create a new user (Manager, Developer only)
  fastify.post("/", {
    preHandler: [
      authenticate,
      authorize(["manager", "developer"]),
      validateBody(createUserSchema),
    ],
    handler: userController.create,
  });

  // Update user (all users - with permission checks in the service)
  fastify.put("/:id", {
    preHandler: [authenticate, validateBody(updateUserSchema)],
    handler: userController.update,
  });

  // Delete user (Developer only)
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["developer"])],
    handler: userController.deleteById,
  });
}
