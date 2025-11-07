// ==========================================
// products.controller.js
// ==========================================

import * as productsService from "./products.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  productIdSchema,
} from "./products.schema.js";

/**
 * Get all products
 */
export const getAllProducts = async (request, reply) => {
  const currentUser = request.user;
  const filters = {
    search: request.query.search,
    category: request.query.category,
    lowStock: request.query.lowStock === "true",
    status: request.query.status,
  };

  const products = await productsService.getAllProducts(
    request.server.prisma,
    currentUser,
    filters
  );

  return reply.send({
    success: true,
    data: products,
    count: products.length,
  });
};

/**
 * Get product by ID
 */
export const getProductById = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, productIdSchema);

  const currentUser = request.user;

  const product = await productsService.getProductById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: product,
  });
};

/**
 * Search products by name
 */
export const searchProducts = async (request, reply) => {
  const { q } = request.query;
  
  if (!q || q.trim().length < 2) {
    return reply.status(400).send({
      success: false,
      message: "Search term must be at least 2 characters",
    });
  }

  const currentUser = request.user;

  const products = await productsService.searchProducts(
    request.server.prisma,
    q,
    currentUser
  );

  return reply.send({
    success: true,
    data: products,
    count: products.length,
  });
};

/**
 * Get all unique categories
 */
export const getCategories = async (request, reply) => {
  const currentUser = request.user;

  const categories = await productsService.getCategories(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: categories,
  });
};

/**
 * Get products statistics
 */
export const getProductsStats = async (request, reply) => {
  const currentUser = request.user;

  const stats = await productsService.getProductsStats(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: stats,
  });
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (request, reply) => {
  const threshold = request.query.threshold
    ? Number(request.query.threshold)
    : 10;

  const currentUser = request.user;

  const products = await productsService.getLowStockProducts(
    request.server.prisma,
    currentUser,
    threshold
  );

  return reply.send({
    success: true,
    data: products,
    count: products.length,
  });
};

/**
 * Create new product
 */
export const createProduct = async (request, reply) => {
  validateSchema(request.body, createProductSchema);

  const currentUser = request.user;

  const product = await productsService.createProduct(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "Product created successfully",
    data: product,
  });
};

/**
 * Update product
 */
export const updateProduct = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, productIdSchema);
  validateSchema(request.body, updateProductSchema);

  const currentUser = request.user;

  const product = await productsService.updateProduct(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
};

/**
 * Update product stock only
 */
export const updateProductStock = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, productIdSchema);
  validateSchema(request.body, updateStockSchema);

  const currentUser = request.user;

  const product = await productsService.updateProductStock(
    request.server.prisma,
    Number(id),
    request.body.stock,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Stock updated successfully",
    data: product,
  });
};

/**
 * Delete product
 */
export const deleteProduct = async (request, reply) => {
  const { id } = request.params;
  validateSchema({ id: Number(id) }, productIdSchema);

  const currentUser = request.user;

  await productsService.deleteProduct(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "Product deleted successfully",
  });
};