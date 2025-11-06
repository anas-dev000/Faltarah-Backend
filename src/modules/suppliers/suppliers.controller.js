import * as supplierService from "./suppliers.service.js";

/**
 * Get all suppliers
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;
  const suppliers = await supplierService.getAllSuppliers(
    request.server.prisma,
    currentUser
  );
  return reply.send({
    success: true,
    data: suppliers,
    count: suppliers.length,
  });
};

/**
 * Get supplier by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const supplier = await supplierService.getSupplierById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: supplier,
  });
};

/**
 * Create a new supplier
 */
export const create = async (request, reply) => {
  const currentUser = request.user;
  const supplier = await supplierService.createNewSupplier(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "Supplier created successfully",
    data: supplier,
  });
};

/**
 * Update existing supplier
 */
export const update = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const supplier = await supplierService.updateExistingSupplier(
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
};

/**
 * Delete supplier
 */
export const deleteById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  await supplierService.deleteExistingSupplier(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "Supplier deleted successfully",
  });
};