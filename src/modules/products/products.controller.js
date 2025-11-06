// ==========================================
// products.controller.js
// ==========================================

import { ProductsService } from "./products.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  productQuerySchema,
  productIdSchema,
} from "./products.schema.js";

export class ProductsController {
  constructor(prisma) {
    this.service = new ProductsService(prisma);
  }

  /**
   * GET /api/products
   * Get all products with filters
   */
  getAllProducts = async (request, reply) => {
    const query = {
      category: request.query.category,
      supplierId: request.query.supplierId
        ? Number(request.query.supplierId)
        : undefined,
      minPrice: request.query.minPrice
        ? Number(request.query.minPrice)
        : undefined,
      maxPrice: request.query.maxPrice
        ? Number(request.query.maxPrice)
        : undefined,
      lowStock: request.query.lowStock === "true",
      stockThreshold: request.query.stockThreshold
        ? Number(request.query.stockThreshold)
        : undefined,
      page: request.query.page ? Number(request.query.page) : undefined,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
      sortBy: request.query.sortBy,
      sortOrder: request.query.sortOrder,
    };

    // Validate query parameters
    validateSchema(query, productQuerySchema);

    // Add companyId from middleware
    const filters = {
      ...query,
      companyId: request.userCompanyId,
    };

    const result = await this.service.getAllProducts(filters);

    return reply.status(200).send({
      success: true,
      ...result,
    });
  };

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  getProductById = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, productIdSchema);

    const product = await this.service.getProductById(
      params.id,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: product,
    });
  };

  /**
   * POST /api/products
   * Create new product
   */
  createProduct = async (request, reply) => {
    const data = {
      name: request.body.name,
      category: request.body.category,
      price: Number(request.body.price),
      stock: request.body.stock !== undefined ? Number(request.body.stock) : 0,
      supplierId: Number(request.body.supplierId),
      companyId: request.userCompanyId || Number(request.body.companyId),
      relatedAccessories: request.body.relatedAccessories,
    };

    validateSchema(data, createProductSchema);

    const product = await this.service.createProduct(data);

    return reply.status(201).send({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  };

  /**
   * PUT /api/products/:id
   * Update product
   */
  updateProduct = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, productIdSchema);

    const data = {
      name: request.body.name,
      category: request.body.category,
      price: request.body.price !== undefined ? Number(request.body.price) : undefined,
      stock: request.body.stock !== undefined ? Number(request.body.stock) : undefined,
      supplierId: request.body.supplierId
        ? Number(request.body.supplierId)
        : undefined,
      relatedAccessories: request.body.relatedAccessories,
    };

    validateSchema(data, updateProductSchema);

    const product = await this.service.updateProduct(
      params.id,
      data,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  };

  /**
   * PATCH /api/products/:id/stock
   * Update product stock
   */
  updateProductStock = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, productIdSchema);

    const data = {
      stock: Number(request.body.stock),
      operation: request.body.operation || "set",
    };

    validateSchema(data, updateStockSchema);

    const product = await this.service.updateProductStock(
      params.id,
      data.stock,
      data.operation,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      message: "Product stock updated successfully",
      data: product,
    });
  };

  /**
   * DELETE /api/products/:id
   * Delete product
   */
  deleteProduct = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, productIdSchema);

    const result = await this.service.deleteProduct(
      params.id,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      ...result,
    });
  };

  /**
   * GET /api/products/low-stock-count
   * Get low stock products count
   */
  getLowStockCount = async (request, reply) => {
    const threshold = request.query.threshold
      ? Number(request.query.threshold)
      : 10;

    const result = await this.service.getLowStockCount(
      request.userCompanyId,
      threshold
    );

    return reply.status(200).send({
      success: true,
      data: result,
    });
  };

  /**
   * GET /api/products/stats
   * Get products statistics
   */
  getProductsStats = async (request, reply) => {
    const stats = await this.service.getProductsStats(request.userCompanyId);

    return reply.status(200).send({
      success: true,
      data: stats,
    });
  };

  /**
   * GET /api/products/supplier/:supplierId
   * Get products by supplier
   */
  getProductsBySupplierId = async (request, reply) => {
    const supplierId = Number(request.params.supplierId);

    if (!supplierId || supplierId <= 0) {
      return reply.status(400).send({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const products = await this.service.getProductsBySupplierId(
      supplierId,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: products,
    });
  };

  /**
   * POST /api/products/bulk-update-stock
   * Bulk update stock
   */
  bulkUpdateStock = async (request, reply) => {
    const updates = request.body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "Updates must be a non-empty array",
      });
    }

    const result = await this.service.bulkUpdateStock(
      updates,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      message: "Bulk stock update completed",
      data: result,
    });
  };

  /**
   * GET /api/products/search
   * Search products
   */
  searchProducts = async (request, reply) => {
    const searchTerm = request.query.q;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        message: "Search term must be at least 2 characters",
      });
    }

    const products = await this.service.searchProducts(
      searchTerm,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: products,
    });
  };

  /**
   * GET /api/products/:id/with-accessories
   * Get product with full accessories details
   */
  getProductWithAccessories = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, productIdSchema);

    const product = await this.service.getProductWithAccessories(
      params.id,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: product,
    });
  };
}