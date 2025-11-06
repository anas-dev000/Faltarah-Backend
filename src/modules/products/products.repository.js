// ==========================================
// products.repository.js
// ==========================================

import { AppError } from "../../shared/errors/AppError.js";

export class ProductsRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Find all products with optional filters
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
      sortBy = "createdAt",
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

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          id: "desc"
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
          productAccessories: {
            include: {
              accessory: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  price: true,
                  stock: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find product by ID
   */
  async findById(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findFirst({
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
            accessory: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  /**
   * Create new product
   */
  async create(data) {
    try {
      const product = await this.prisma.product.create({
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

      return product;
    } catch (error) {
      if (error.code === "P2003") {
        throw new AppError("Supplier or Company not found", 404);
      }
      throw error;
    }
  }

  /**
   * Update product
   */
  async update(id, data, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    // Check if product exists
    const existing = await this.prisma.product.findFirst({ where });
    if (!existing) {
      throw new AppError("Product not found", 404);
    }

    try {
      const product = await this.prisma.product.update({
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

      return product;
    } catch (error) {
      if (error.code === "P2003") {
        throw new AppError("Supplier not found", 404);
      }
      throw error;
    }
  }

  /**
   * Update product stock
   */
  async updateStock(id, stock, operation = "set", companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findFirst({ where });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let newStock = stock;

    if (operation === "add") {
      newStock = product.stock + stock;
    } else if (operation === "subtract") {
      newStock = product.stock - stock;
      if (newStock < 0) {
        throw new AppError("Insufficient stock", 400);
      }
    }

    return await this.prisma.product.update({
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
   * Delete product
   */
  async delete(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findFirst({ where });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Delete related product accessories first
    await this.prisma.productAccessory.deleteMany({
      where: { productId: id },
    });

    await this.prisma.product.delete({ where: { id } });

    return { message: "Product deleted successfully" };
  }

  /**
   * Link accessories to product
   */
  async linkAccessories(productId, accessoryIds, companyId = null) {
    const where = { id: productId };
    if (companyId) {
      where.companyId = companyId;
    }

    // Check if product exists
    const product = await this.prisma.product.findFirst({ where });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Delete existing links
    await this.prisma.productAccessory.deleteMany({
      where: { productId },
    });

    // Create new links if accessories provided
    if (accessoryIds && accessoryIds.length > 0) {
      const links = accessoryIds.map((accessoryId) => ({
        productId,
        accessoryId,
      }));

      await this.prisma.productAccessory.createMany({
        data: links,
        skipDuplicates: true,
      });
    }

    return await this.findById(productId, companyId);
  }

  /**
   * Get low stock products count
   */
  async getLowStockCount(companyId, threshold = 10) {
    const count = await this.prisma.product.count({
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
   * Get products by category
   */
  async getByCategory(companyId) {
    const products = await this.prisma.product.groupBy({
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

    return products.map((item) => ({
      category: item.category,
      count: item._count.id,
      totalStock: item._sum.stock || 0,
      averagePrice: item._avg.price || 0,
    }));
  }

  /**
   * Get products by supplier
   */
  async getBySupplierId(supplierId, companyId = null) {
    const where = { supplierId };
    if (companyId) {
      where.companyId = companyId;
    }

    return await this.prisma.product.findMany({
      where,
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
    });
  }

  /**
   * Check if product exists
   */
  async exists(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const count = await this.prisma.product.count({ where });
    return count > 0;
  }
}