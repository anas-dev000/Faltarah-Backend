// ==========================================
// products.service.js
// ==========================================

import * as productsRepository from "./products.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Get all products with filters
 */
export const getAllProducts = async (prisma, currentUser, filters = {}) => {
  const { role, companyId } = currentUser;

  // Developer can see all products
  const targetCompanyId = role === "developer" ? null : companyId;

  return await productsRepository.findAll(prisma, targetCompanyId, filters);
};

/**
 * Get product by ID
 */
export const getProductById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Developer can access any product
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

  // Only manager and developer can create
  if (role === "employee") {
    throw new AppError("Employees cannot create products", 403);
  }

  // Manager can only create for their company
  const targetCompanyId = role === "developer" ? data.companyId : companyId;

  if (!targetCompanyId) {
    throw new AppError("Company ID is required", 400);
  }

  // Check if supplier exists and belongs to the same company
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });

  if (!supplier) {
    throw new AppError("Supplier not found", 404);
  }

  if (role === "manager" && supplier.companyId !== companyId) {
    throw new AppError("Supplier does not belong to your company", 403);
  }

  // Check for duplicate name in the same company
  const existing = await productsRepository.findByNameAndCompany(
    prisma,
    data.name,
    targetCompanyId
  );

  if (existing) {
    throw new AppError("Product with this name already exists", 409);
  }

  // Create product
  const productData = {
    name: data.name,
    category: data.category,
    price: Number(data.price),
    stock: data.stock !== undefined ? Number(data.stock) : 0,
    supplierId: Number(data.supplierId),
    companyId: targetCompanyId,
  };

  const product = await productsRepository.create(prisma, productData);

  // Handle related accessories if provided
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

  // Return product with relations
  return await productsRepository.findById(prisma, product.id, targetCompanyId);
};

/**
 * Update product
 */
export const updateProduct = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can update
  if (role === "employee") {
    throw new AppError("Employees cannot update products", 403);
  }

  // Check if product exists
  const existing = await getProductById(prisma, id, currentUser);

  // Manager can only update products in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update products in your company", 403);
  }

  // If name is being changed, check for duplicates
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

  // If supplier is being changed, validate it
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

  // Update product
  const updateData = {
    ...(data.name && { name: data.name }),
    ...(data.category && { category: data.category }),
    ...(data.price !== undefined && { price: Number(data.price) }),
    ...(data.stock !== undefined && { stock: Number(data.stock) }),
    ...(data.supplierId && { supplierId: Number(data.supplierId) }),
  };

  await productsRepository.update(prisma, id, updateData);

  // Handle related accessories if provided
  if (data.relatedItems !== undefined) {
    // Delete existing relations
    await prisma.productAccessory.deleteMany({
      where: { productId: id },
    });

    // Create new relations
    if (Array.isArray(data.relatedItems) && data.relatedItems.length > 0) {
      await productsRepository.linkAccessories(prisma, id, data.relatedItems);
    }
  }

  // Return updated product
  const targetCompanyId = role === "developer" ? null : companyId;
  return await productsRepository.findById(prisma, id, targetCompanyId);
};

/**
 * Update product stock
 */
export const updateProductStock = async (prisma, id, newStock, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can update stock
  if (role === "employee") {
    throw new AppError("Employees cannot update stock", 403);
  }

  // Check if product exists
  const existing = await getProductById(prisma, id, currentUser);

  // Manager can only update products in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update products in your company", 403);
  }

  // Update stock
  await productsRepository.update(prisma, id, { stock: Number(newStock) });

  // Return updated product
  const targetCompanyId = role === "developer" ? null : companyId;
  return await productsRepository.findById(prisma, id, targetCompanyId);
};

/**
 * Delete product
 */
export const deleteProduct = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Only developer can delete
  if (role === "employee") {
    throw new AppError("Employees cannot delete products", 403);
  }

  // Check if product exists
  const existing = await getProductById(prisma, id, currentUser);

  // Developer can only delete products in their company
  if (role === "developer" && existing.companyId !== companyId) {
    throw new AppError("You can only delete products in your company", 403);
  }

  // Check if product is used in any invoices
  const invoiceItemsCount = await prisma.invoiceItem.count({
    where: { productId: id },
  });

  if (invoiceItemsCount > 0) {
    throw new AppError("Cannot delete product that is used in invoices", 400);
  }

  // Delete product accessories relations
  await prisma.productAccessory.deleteMany({
    where: { productId: id },
  });

  // Delete product
  await productsRepository.deleteById(prisma, id);

  return { success: true };
};
