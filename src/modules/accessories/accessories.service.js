// ==========================================
// accessories.service.js (FIXED)
// ==========================================

import { AccessoriesRepository } from "./accessories.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

export class AccessoriesService {
  constructor(prisma) {
    this.repository = new AccessoriesRepository(prisma);
  }

  /**
   * Get all accessories with filters
   */
  async getAllAccessories(filters) {
    return await this.repository.findAll(filters);
  }

  /**
   * Get accessory by ID
   */
  async getAccessoryById(id, companyId = null) {
    return await this.repository.findById(id, companyId);
  }

  /**
   * Create new accessory
   */
  async createAccessory(data) {
    // Validate supplier exists
    const supplierExists = await this.repository.prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplierExists) {
      throw new AppError("Supplier not found", 404);
    }

    // Validate company exists if provided
    if (data.companyId) {
      const companyExists = await this.repository.prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!companyExists) {
        throw new AppError("Company not found", 404);
      }
    }

    // Check for duplicate name in same company
    const duplicate = await this.repository.prisma.accessory.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId,
      },
    });

    if (duplicate) {
      throw new AppError(
        "Accessory with this name already exists in your company",
        409
      );
    }

    return await this.repository.create(data);
  }

  /**
   * Update accessory
   */
  async updateAccessory(id, data, companyId = null) {
    // Check if trying to update name to existing name
    if (data.name) {
      const duplicate = await this.repository.prisma.accessory.findFirst({
        where: {
          name: data.name,
          companyId: companyId || data.companyId,
          NOT: {
            id: id,
          },
        },
      });

      if (duplicate) {
        throw new AppError(
          "Accessory with this name already exists in your company",
          409
        );
      }
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplierExists = await this.repository.prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplierExists) {
        throw new AppError("Supplier not found", 404);
      }
    }

    return await this.repository.update(id, data, companyId);
  }

  /**
   * Update accessory stock
   */
  async updateAccessoryStock(id, stock, operation = "set", companyId = null) {
    if (!["set", "add", "subtract"].includes(operation)) {
      throw new AppError(
        "Invalid operation. Must be 'set', 'add', or 'subtract'",
        400
      );
    }

    return await this.repository.updateStock(id, stock, operation, companyId);
  }

  /**
   * Delete accessory
   */
  async deleteAccessory(id, companyId = null) {
    return await this.repository.delete(id, companyId);
  }

  /**
   * Get low stock accessories count
   */
  async getLowStockCount(companyId, threshold = 10) {
    return await this.repository.getLowStockCount(companyId, threshold);
  }

  /**
   * Get accessories statistics
   */
  async getAccessoriesStats(companyId) {
    const [totalCount, totalValue, lowStockCount, byCategory] =
      await Promise.all([
        this.repository.prisma.accessory.count({
          where: { companyId },
        }),
        this.repository.prisma.accessory.aggregate({
          where: { companyId },
          _sum: {
            stock: true,
          },
          _avg: {
            price: true,
          },
        }),
        this.repository.getLowStockCount(companyId),
        // ✅ شلنا byCategory عشان category مش موجود في الـ schema
      ]);

    return {
      totalAccessories: totalCount,
      totalStock: totalValue._sum.stock || 0,
      averagePrice: totalValue._avg.price || 0,
      lowStockCount: lowStockCount.count,
    };
  }

  /**
   * Get accessories by supplier
   */
  async getAccessoriesBySupplierId(supplierId, companyId = null) {
    // Validate supplier exists
    const supplierExists = await this.repository.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplierExists) {
      throw new AppError("Supplier not found", 404);
    }

    return await this.repository.getBySupplierId(supplierId, companyId);
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(updates, companyId = null) {
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const result = await this.repository.updateStock(
          update.id,
          update.stock,
          update.operation || "set",
          companyId
        );
        results.push({
          id: update.id,
          success: true,
          data: result,
        });
      } catch (error) {
        errors.push({
          id: update.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: updates.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  }

  /**
   * Search accessories
   */
  async searchAccessories(searchTerm, companyId = null) {
    // ✅ شلنا الـ category من البحث
    const accessories = await this.repository.prisma.accessory.findMany({
      where: {
        ...(companyId && { companyId }),
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 20,
    });

    return accessories;
  }
}