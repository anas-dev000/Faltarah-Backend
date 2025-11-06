// ==========================================
// accessories.repository.js
// ==========================================

import { AppError } from "../../shared/errors/AppError.js";

export class AccessoriesRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Find all accessories with optional filters
   */
  async findAll(filters = {}) {
    const {
      companyId,
      category,
      supplierId,
      minPrice,
      maxPrice,
      lowStock,
      stockThreshold = 10,
      page = 1,
      limit = 50,
      sortBy = "id",
      sortOrder = "desc",
    } = filters;

    const where = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (category) {
      where.category = {
        contains: category,
        mode: "insensitive",
      };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (lowStock) {
      where.stock = {
        lte: stockThreshold,
      };
    }

    const skip = (page - 1) * limit;

    const [accessories, total] = await Promise.all([
      this.prisma.accessory.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.accessory.count({ where }),
    ]);

    return {
      data: accessories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find accessory by ID
   */
  async findById(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const accessory = await this.prisma.accessory.findFirst({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        productAccessories: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!accessory) {
      throw new AppError("Accessory not found", 404);
    }

    return accessory;
  }

  /**
   * Create new accessory
   */
  async create(data) {
    try {
      const accessory = await this.prisma.accessory.create({
        data: {
          name: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock || 0,
          supplierId: data.supplierId,
          companyId: data.companyId,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return accessory;
    } catch (error) {
      if (error.code === "P2003") {
        throw new AppError("Supplier or Company not found", 404);
      }
      throw error;
    }
  }

  /**
   * Update accessory
   */
  async update(id, data, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    // Check if accessory exists
    const existing = await this.prisma.accessory.findFirst({ where });
    if (!existing) {
      throw new AppError("Accessory not found", 404);
    }

    try {
      const accessory = await this.prisma.accessory.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.category && { category: data.category }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.stock !== undefined && { stock: data.stock }),
          ...(data.supplierId && { supplierId: data.supplierId }),
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return accessory;
    } catch (error) {
      if (error.code === "P2003") {
        throw new AppError("Supplier not found", 404);
      }
      throw error;
    }
  }

  /**
   * Update accessory stock
   */
  async updateStock(id, stock, operation = "set", companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const accessory = await this.prisma.accessory.findFirst({ where });
    if (!accessory) {
      throw new AppError("Accessory not found", 404);
    }

    let newStock = stock;

    if (operation === "add") {
      newStock = accessory.stock + stock;
    } else if (operation === "subtract") {
      newStock = accessory.stock - stock;
      if (newStock < 0) {
        throw new AppError("Insufficient stock", 400);
      }
    }

    return await this.prisma.accessory.update({
      where: { id },
      data: { stock: newStock },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Delete accessory
   */
  async delete(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const accessory = await this.prisma.accessory.findFirst({ where });
    if (!accessory) {
      throw new AppError("Accessory not found", 404);
    }

    // Check if accessory is linked to any products
    const linkedProducts = await this.prisma.productAccessory.count({
      where: { accessoryId: id },
    });

    if (linkedProducts > 0) {
      throw new AppError(
        "Cannot delete accessory that is linked to products",
        400
      );
    }

    await this.prisma.accessory.delete({ where: { id } });

    return { message: "Accessory deleted successfully" };
  }

  /**
   * Get low stock accessories count
   */
  async getLowStockCount(companyId, threshold = 10) {
    const count = await this.prisma.accessory.count({
      where: {
        companyId,
        stock: {
          lte: threshold,
        },
      },
    });

    return { count, threshold };
  }

  /**
   * Get accessories by category
   */
  async getByCategory(companyId) {
    const accessories = await this.prisma.accessory.groupBy({
      by: ["category"],
      where: {
        companyId,
      },
      _count: {
        id: true,
      },
      _sum: {
        stock: true,
      },
      _avg: {
        price: true,
      },
    });

    return accessories.map((item) => ({
      category: item.category,
      count: item._count.id,
      totalStock: item._sum.stock || 0,
      averagePrice: item._avg.price || 0,
    }));
  }

  /**
   * Get accessories by supplier
   */
  async getBySupplierId(supplierId, companyId = null) {
    const where = { supplierId };
    if (companyId) {
      where.companyId = companyId;
    }

    return await this.prisma.accessory.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Check if accessory exists
   */
  async exists(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const count = await this.prisma.accessory.count({ where });
    return count > 0;
  }
}