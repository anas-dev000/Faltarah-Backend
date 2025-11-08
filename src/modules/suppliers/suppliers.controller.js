import * as suppliersService from "./suppliers.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
} from "./suppliers.schema.js";

/**
 * Get all suppliers with optional filters
 */
export async function getAllSuppliers(request, reply) {
  try {
    const { search } = request.query;
    const currentUser = request.user;

    const suppliers = await suppliersService.getAllSuppliers(
      request.server.prisma,
      currentUser,
      { search }
    );

    return reply.send({
      success: true,
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Search suppliers by name or contact info
 */
export async function searchSuppliers(request, reply) {
  try {
    const { q } = request.query;

    if (!q || q.length < 2) {
      return reply.status(400).send({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const currentUser = request.user;

    const suppliers = await suppliersService.searchSuppliers(
      request.server.prisma,
      q,
      currentUser
    );

    return reply.send({
      success: true,
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(supplierIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid supplier ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;

    const supplier = await suppliersService.getSupplierById(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      data: supplier,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create new supplier
 */
export async function createSupplier(request, reply) {
  try {
    const validation = validateSchema(createSupplierSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;

    const supplier = await suppliersService.createSupplier(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update supplier
 */
export async function updateSupplier(request, reply) {
  try {
    const { id } = request.params;
    const idValidation = validateSchema(supplierIdSchema, { id: Number(id) });

    if (!idValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid supplier ID",
        details: idValidation.errors,
      });
    }

    const validation = validateSchema(updateSupplierSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;

    const supplier = await suppliersService.updateSupplier(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(supplierIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid supplier ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;

    await suppliersService.deleteSupplier(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}
