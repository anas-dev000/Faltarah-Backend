// ==========================================
// employee.routes.js
// ==========================================

import * as employeeController from "./employees.controller.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employees.schema.js";
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

export default async function employeeRoutes(fastify) {
  // Get all employees (Manager, Developer only)
  fastify.get("/", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: employeeController.getAll,
  });
  // Get all status of employees 
  fastify.get('/status', {
    preHandler: [authenticate],
    handler: employeeController.getAllStatus
  })
  fastify.get('/status/:statusEmployee', {
    preHandler: [authenticate],
    handler: employeeController.getByStatus
  })
  // Get employee by ID
  fastify.get("/:id", {
    preHandler: [authenticate],
    handler: employeeController.getById,
  });
  // Get all roles of employees 
  fastify.get('/roles', {
    preHandler: [authenticate],
    handler: employeeController.getAllRoles
  })
  // Get Employees By role
  fastify.get('/role/:employeeRole', {
    preHandler: [authenticate],
    handler: employeeController.getByRole
  })

  // Create new employee
  fastify.post("/", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: employeeController.create,
  });

  // Update existing employee
  fastify.put("/:id", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: employeeController.update,
  });

  // Delete employee
  fastify.delete("/:id", {
    preHandler: [authenticate, authorize(["manager", "developer"])],
    handler: employeeController.deleteById,
  });
}
