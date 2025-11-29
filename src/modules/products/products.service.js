// ==========================================
// products.service.js
// ==========================================

import * as productsRepository from "./products.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Get all products with filters
 */
export const getAllProducts = async (
  prisma,
  currentUser,
  filters = {},
  pagination = {}
) => {
  const { role, companyId } = currentUser;
  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.findAll(
    prisma,
    targetCompanyId,
    filters,
    pagination
  );
};

/**
 * Get product by ID
 */
export const getProductById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  const product = await productsRepository.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!product) {
    throw new AppError("Product not found or access denied", 404);
  }

  return product;
};

/**
 * Search products by name
 */
export const searchProducts = async (prisma, searchTerm, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.searchByName(
    prisma,
    searchTerm,
    targetCompanyId
  );
};

/**
 * Get all unique categories
 */
export const getCategories = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.getCategories(prisma, targetCompanyId);
};

/**
 * Get products statistics
 */
export const getProductsStats = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.getStats(prisma, targetCompanyId);
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (
  prisma,
  currentUser,
  threshold = 10
) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.findLowStock(
    prisma,
    targetCompanyId,
    threshold
  );
};

/**
 * Create new product
 */
export const createProduct = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Employees cannot create products", 403);
  }

  const targetCompanyId = role === "developer" ? data.companyId : companyId;

  if (!targetCompanyId) {
    throw new AppError("Company ID is required", 400);
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  if (role === "manager" && supplier.companyId !== companyId) {
    throw new AppError("Supplier does not belong to your company", 403);
  }

  const existing = await productsRepository.findByNameAndCompany(
    prisma,
    data.name,
    targetCompanyId
  );

  if (existing) {
    throw new AppError("Product with this name already exists", 409);
  }

  const productData = {
    name: data.name,
    category: data.category,
    price: Number(data.price),
    stock: data.stock !== undefined ? Number(data.stock) : 0,
    supplierId: Number(data.supplierId),
    companyId: targetCompanyId,
  };

  const product = await productsRepository.create(prisma, productData);

  if (
    data.relatedItems &&
    Array.isArray(data.relatedItems) &&
    data.relatedItems.length > 0
  ) {
    await productsRepository.linkAccessories(
      prisma,
      product.id,
      data.relatedItems
    );
  }

  return await productsRepository.findById(prisma, product.id, targetCompanyId);
};

/**
 * Update product
 */
export const updateProduct = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Employees cannot update products", 403);
  }

  const existing = await getProductById(prisma, id, currentUser);

  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update products in your company", 403);
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await productsRepository.findByNameAndCompany(
      prisma,
      data.name,
      existing.companyId,
      id
    );

    if (duplicate) {
      throw new AppError("Product with this name already exists", 409);
    }
  }

  if (data.supplierId && data.supplierId !== existing.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(data.supplierId) },
    });

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    if (role === "manager" && supplier.companyId !== companyId) {
      throw new AppError("Supplier does not belong to your company", 403);
    }
  }

  const updateData = {
    ...(data.name && { name: data.name }),
    ...(data.category && { category: data.category }),
    ...(data.price !== undefined && { price: Number(data.price) }),
    ...(data.supplierId && { supplierId: Number(data.supplierId) }),
  };

  await productsRepository.update(prisma, id, updateData);

  if (data.relatedItems !== undefined) {
    await prisma.productAccessory.deleteMany({
      where: { productId: id },
    });

    if (Array.isArray(data.relatedItems) && data.relatedItems.length > 0) {
      await productsRepository.linkAccessories(prisma, id, data.relatedItems);
    }
  }

  const targetCompanyId = role === "developer" ? null : companyId;
  return await productsRepository.findById(prisma, id, targetCompanyId);
};

/**
 * Update product stock
 */
export const updateProductStock = async (prisma, id, newStock, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Employees cannot update stock", 403);
  }

  const existing = await getProductById(prisma, id, currentUser);

  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update products in your company", 403);
  }

  await productsRepository.update(prisma, id, { stock: Number(newStock) });

  const targetCompanyId = role === "developer" ? null : companyId;
  return await productsRepository.findById(prisma, id, targetCompanyId);
};

/**
 *  Delete product with cascading deletion
 */
export const deleteProduct = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can delete
  if (role === "employee") {
    throw new AppError("Employees cannot delete products", 403);
  }

  const existing = await getProductById(prisma, id, currentUser);

  // Manager can only delete products in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only delete products in your company", 403);
  }

  //  Delete product with all relations
  return await productsRepository.deleteByIdWithRelations(prisma, id);
};
