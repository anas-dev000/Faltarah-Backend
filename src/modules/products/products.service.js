// ==========================================
// products.service.js
// ==========================================

import { ProductsRepository } from "./products.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

export class ProductsService {
  constructor(prisma) {
    this.repository = new ProductsRepository(prisma);
  }

  /**
   * Get all products with filters
   */
  async getAllProducts(filters) {
    return await this.repository.findAll(filters);
  }

  /**
   * Get product by ID
   */
  async getProductById(id, companyId = null) {
    return await this.repository.findById(id, companyId);
  }

  /**
   * Create new product
   */
  async createProduct(data) {
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
    const duplicate = await this.repository.prisma.product.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId,
      },
    });

    if (duplicate) {
      throw new AppError(
        "Product with this name already exists in your company",
        409
      );
    }

    // Validate related accessories if provided
    if (data.relatedAccessories && data.relatedAccessories.length > 0) {
      const accessories = await this.repository.prisma.accessory.findMany({
        where: {
          id: { in: data.relatedAccessories },
          companyId: data.companyId,
        },
      });

      if (accessories.length !== data.relatedAccessories.length) {
        throw new AppError("Some accessories not found", 404);
      }
    }

    // Create product
    const product = await this.repository.create(data);

    // Link accessories if provided
    if (data.relatedAccessories && data.relatedAccessories.length > 0) {
      return await this.repository.linkAccessories(
        product.id,
        data.relatedAccessories,
        data.companyId
      );
    }

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id, data, companyId = null) {
    // Check if trying to update name to existing name
    if (data.name) {
      const duplicate = await this.repository.prisma.product.findFirst({
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
          "Product with this name already exists in your company",
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

    // Validate related accessories if provided
    if (data.relatedAccessories) {
      if (data.relatedAccessories.length > 0) {
        const accessories = await this.repository.prisma.accessory.findMany({
          where: {
            id: { in: data.relatedAccessories },
            companyId: companyId,
          },
        });

        if (accessories.length !== data.relatedAccessories.length) {
          throw new AppError("Some accessories not found", 404);
        }
      }
    }

    // Update product
    const product = await this.repository.update(id, data, companyId);

    // Update accessories if provided
    if (data.relatedAccessories !== undefined) {
      return await this.repository.linkAccessories(
        id,
        data.relatedAccessories,
        companyId
      );
    }

    return product;
  }

  /**
   * Update product stock
   */
  async updateProductStock(id, stock, operation = "set", companyId = null) {
    if (!["set", "add", "subtract"].includes(operation)) {
      throw new AppError(
        "Invalid operation. Must be 'set', 'add', or 'subtract'",
        400
      );
    }

    return await this.repository.updateStock(id, stock, operation, companyId);
  }

  /**
   * Delete product
   */
  async deleteProduct(id, companyId = null) {
    return await this.repository.delete(id, companyId);
  }

  /**
   * Get low stock products count
   */
  async getLowStockCount(companyId, threshold = 10) {
    return await this.repository.getLowStockCount(companyId, threshold);
  }

  /**
   * Get products statistics
   */
  async getProductsStats(companyId) {
    const [totalCount, totalValue, lowStockCount, byCategory] =
      await Promise.all([
        this.repository.prisma.product.count({
          where: { companyId },
        }),
        this.repository.prisma.product.aggregate({
          where: { companyId },
          _sum: {
            stock: true,
          },
          _avg: {
            price: true,
          },
        }),
        this.repository.getLowStockCount(companyId),
        this.repository.getByCategory(companyId),
      ]);

    return {
      totalProducts: totalCount,
      totalStock: totalValue._sum.stock || 0,
      averagePrice: totalValue._avg.price || 0,
      lowStockCount: lowStockCount.count,
      byCategory,
    };
  }

  /**
   * Get products by supplier
   */
  async getProductsBySupplierId(supplierId, companyId = null) {
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
   * Search products
   */
  async searchProducts(searchTerm, companyId = null) {
    const products = await this.repository.prisma.product.findMany({
      where: {
        ...(companyId && { companyId }),
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        productAccessories: {
          include: {
            accessory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 20,
    });

    return products;
  }

  /**
   * Get product with full details including accessories
   */
  async getProductWithAccessories(id, companyId = null) {
    const product = await this.repository.findById(id, companyId);

    // Calculate total accessories value
    const accessoriesValue = product.productAccessories.reduce((total, pa) => {
      return total + (pa.accessory.price * pa.accessory.stock || 0);
    }, 0);

    return {
      ...product,
      accessoriesCount: product.productAccessories.length,
      accessoriesValue,
    };
  }
}