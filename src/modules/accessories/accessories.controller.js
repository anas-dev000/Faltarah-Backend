// ==========================================
// accessories.controller.js
// ==========================================

import * as accessoriesService from "./accessories.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createAccessorySchema,
  updateAccessorySchema,
  updateStockSchema,
  accessoryIdSchema,
} from "./accessories.schema.js";

/**
 * Get all accessories
 */
export const getAllAccessories = async (request, reply) => {
  const currentUser = request.user;
  const filters = {
    search: request.query.search,
    lowStock: request.query.lowStock === "true",
    status: request.query.status,
  };

  const pagination = {
    page: request.query.page || 1,
    limit: request.query.limit || 10,
  };

  const result = await accessoriesService.getAllAccessories(
    request.server.prisma,
    currentUser,
    filters,
    pagination
  );

  return reply.send({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

/**
 * Get accessory by ID
 */
export const getAccessoryById = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, accessoryIdSchema);

  const currentUser = request.user;

  const accessory = await accessoriesService.getAccessoryById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: accessory,
  });
};

/**
 * Search accessories by name
 */
export const searchAccessories = async (request, reply) => {
  const { q } = request.query;
  
  if (!q || q.trim().length < 2) {
    return reply.status(400).send({
      success: false,
      message: "Search term must be at least 2 characters",
    });
  }

  const currentUser = request.user;

  const accessories = await accessoriesService.searchAccessories(
    request.server.prisma,
    q,
    currentUser
  );

  return reply.send({
    success: true,
    data: accessories,
    count: accessories.length,
  });
};

/**
 * Get accessories statistics
 */
export const getAccessoriesStats = async (request, reply) => {
  const currentUser = request.user;

  const stats = await accessoriesService.getAccessoriesStats(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: stats,
  });
};

/**
 * Get low stock accessories
 */
export const getLowStockAccessories = async (request, reply) => {
  const threshold = request.query.threshold
    ? Number(request.query.threshold)
    : 20;

  const currentUser = request.user;

  const accessories = await accessoriesService.getLowStockAccessories(
    request.server.prisma,
    currentUser,
    threshold
  );

  return reply.send({
    success: true,
    data: accessories,
    count: accessories.length,
  });
};

/**
 * Create new accessory
 */
export const createAccessory = async (request, reply) => {
  validateSchema(request.body, createAccessorySchema);

  const currentUser = request.user;

  const accessory = await accessoriesService.createAccessory(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "Accessory created successfully",
    data: accessory,
  });
};

/**
 * Update accessory
 */
export const updateAccessory = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, accessoryIdSchema);
  validateSchema(request.body, updateAccessorySchema);

  const currentUser = request.user;

  const accessory = await accessoriesService.updateAccessory(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Accessory updated successfully",
    data: accessory,
  });
};

/**
 * Update accessory stock only
 */
export const updateAccessoryStock = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, accessoryIdSchema);
  validateSchema(request.body, updateStockSchema);

  const currentUser = request.user;

  const accessory = await accessoriesService.updateAccessoryStock(
    request.server.prisma,
    Number(id),
    request.body.stock,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Stock updated successfully",
    data: accessory,
  });
};

/**
 * Delete accessory
 */
export const deleteAccessory = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, accessoryIdSchema);

  const currentUser = request.user;

  await accessoriesService.deleteAccessory(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "Accessory deleted successfully",
  });
};