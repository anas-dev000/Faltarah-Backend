// ==========================================
// accessories.controller.js
// ==========================================

import { AccessoriesService } from "./accessories.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createAccessorySchema,
  updateAccessorySchema,
  updateAccessoryStockSchema,
  accessoryQuerySchema,
  accessoryIdSchema,
} from "./accessories.schema.js";

export class AccessoriesController {
  constructor(prisma) {
    this.service = new AccessoriesService(prisma);
  }

  /**
   * GET /api/accessories
   * Get all accessories with filters
   */
  getAllAccessories = async (request, reply) => {
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
    validateSchema(query, accessoryQuerySchema);

    // Add companyId from middleware
    const filters = {
      ...query,
      companyId: request.userCompanyId,
    };

    const result = await this.service.getAllAccessories(filters);

    return reply.status(200).send({
      success: true,
      ...result,
    });
  };

  /**
   * GET /api/accessories/:id
   * Get accessory by ID
   */
  getAccessoryById = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, accessoryIdSchema);

    const accessory = await this.service.getAccessoryById(
      params.id,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: accessory,
    });
  };

  /**
   * POST /api/accessories
   * Create new accessory
   */
  createAccessory = async (request, reply) => {
    const data = {
      name: request.body.name,
      category: request.body.category,
      price: Number(request.body.price),
      stock: request.body.stock !== undefined ? Number(request.body.stock) : 0,
      supplierId: Number(request.body.supplierId),
      companyId: request.userCompanyId || Number(request.body.companyId),
    };

    validateSchema(data, createAccessorySchema);

    const accessory = await this.service.createAccessory(data);

    return reply.status(201).send({
      success: true,
      message: "Accessory created successfully",
      data: accessory,
    });
  };

  /**
   * PUT /api/accessories/:id
   * Update accessory
   */
  updateAccessory = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, accessoryIdSchema);

    const data = {
      name: request.body.name,
      category: request.body.category,
      price: request.body.price !== undefined ? Number(request.body.price) : undefined,
      stock: request.body.stock !== undefined ? Number(request.body.stock) : undefined,
      supplierId: request.body.supplierId
        ? Number(request.body.supplierId)
        : undefined,
    };

    validateSchema(data, updateAccessorySchema);

    const accessory = await this.service.updateAccessory(
      params.id,
      data,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      message: "Accessory updated successfully",
      data: accessory,
    });
  };

  /**
   * PATCH /api/accessories/:id/stock
   * Update accessory stock
   */
  updateAccessoryStock = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, accessoryIdSchema);

    const data = {
      stock: Number(request.body.stock),
      operation: request.body.operation || "set",
    };

    validateSchema(data, updateAccessoryStockSchema);

    const accessory = await this.service.updateAccessoryStock(
      params.id,
      data.stock,
      data.operation,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      message: "Accessory stock updated successfully",
      data: accessory,
    });
  };

  /**
   * DELETE /api/accessories/:id
   * Delete accessory
   */
  deleteAccessory = async (request, reply) => {
    const params = {
      id: Number(request.params.id),
    };

    validateSchema(params, accessoryIdSchema);

    const result = await this.service.deleteAccessory(
      params.id,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      ...result,
    });
  };

  /**
   * GET /api/accessories/low-stock-count
   * Get low stock accessories count
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
   * GET /api/accessories/stats
   * Get accessories statistics
   */
  getAccessoriesStats = async (request, reply) => {
    const stats = await this.service.getAccessoriesStats(
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: stats,
    });
  };

  /**
   * GET /api/accessories/supplier/:supplierId
   * Get accessories by supplier
   */
  getAccessoriesBySupplierId = async (request, reply) => {
    const supplierId = Number(request.params.supplierId);

    if (!supplierId || supplierId <= 0) {
      return reply.status(400).send({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const accessories = await this.service.getAccessoriesBySupplierId(
      supplierId,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: accessories,
    });
  };

  /**
   * POST /api/accessories/bulk-update-stock
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
   * GET /api/accessories/search
   * Search accessories
   */
  searchAccessories = async (request, reply) => {
    const searchTerm = request.query.q;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        message: "Search term must be at least 2 characters",
      });
    }

    const accessories = await this.service.searchAccessories(
      searchTerm,
      request.userCompanyId
    );

    return reply.status(200).send({
      success: true,
      data: accessories,
    });
  };
}