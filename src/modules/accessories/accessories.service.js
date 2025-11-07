// ==========================================
// accessories.service.js
// ==========================================

import * as accessoriesRepository from "./accessories.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Get all accessories with filters
 */
export const getAllAccessories = async (prisma, currentUser, filters = {}) => {
  const { role, companyId } = currentUser;

  // Developer can see all accessories
  const targetCompanyId = role === "developer" ? null : companyId;

  return await accessoriesRepository.findAll(prisma, targetCompanyId, filters);
};

/**
 * Get accessory by ID
 */
export const getAccessoryById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  const accessory = await accessoriesRepository.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!accessory) {
    throw new AppError("Accessory not found or access denied", 404);
  }

  return accessory;
};

/**
 * Search accessories by name
 */
export const searchAccessories = async (prisma, searchTerm, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await accessoriesRepository.searchByName(
    prisma,
    searchTerm,
    targetCompanyId
  );
};

/**
 * Get accessories statistics
 */
export const getAccessoriesStats = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await accessoriesRepository.getStats(prisma, targetCompanyId);
};

/**
 * Get low stock accessories
 */
export const getLowStockAccessories = async (
  prisma,
  currentUser,
  threshold = 20
) => {
  const { role, companyId } = currentUser;

  const targetCompanyId = role === "developer" ? null : companyId;

  return await accessoriesRepository.findLowStock(
    prisma,
    targetCompanyId,
    threshold
  );
};

/**
 * Create new accessory
 */
export const createAccessory = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can create
  if (role === "employee") {
    throw new AppError("Employees cannot create accessories", 403);
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
  const existing = await accessoriesRepository.findByNameAndCompany(
    prisma,
    data.name,
    targetCompanyId
  );

  if (existing) {
    throw new AppError("Accessory with this name already exists", 409);
  }

  // Create accessory
  const accessoryData = {
    name: data.name,
    category: data.category || null,
    price: Number(data.price),
    stock: data.stock !== undefined ? Number(data.stock) : 0,
    supplierId: Number(data.supplierId),
    companyId: targetCompanyId,
  };

  return await accessoriesRepository.create(prisma, accessoryData);
};

/**
 * Update accessory
 */
export const updateAccessory = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can update
  if (role === "employee") {
    throw new AppError("Employees cannot update accessories", 403);
  }

  // Check if accessory exists
  const existing = await getAccessoryById(prisma, id, currentUser);

  // Manager can only update accessories in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update accessories in your company", 403);
  }

  // If name is being changed, check for duplicates
  if (data.name && data.name !== existing.name) {
    const duplicate = await accessoriesRepository.findByNameAndCompany(
      prisma,
      data.name,
      existing.companyId,
      id
    );

    if (duplicate) {
      throw new AppError("Accessory with this name already exists", 409);
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

  // Update accessory
  const updateData = {
    ...(data.name && { name: data.name }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.price !== undefined && { price: Number(data.price) }),
    ...(data.stock !== undefined && { stock: Number(data.stock) }),
    ...(data.supplierId && { supplierId: Number(data.supplierId) }),
  };

  await accessoriesRepository.update(prisma, id, updateData);

  // Return updated accessory
  const targetCompanyId = role === "developer" ? null : companyId;
  return await accessoriesRepository.findById(prisma, id, targetCompanyId);
};

/**
 * Update accessory stock
 */
export const updateAccessoryStock = async (
  prisma,
  id,
  newStock,
  currentUser
) => {
  const { role, companyId } = currentUser;

  // Only manager and developer can update stock
  if (role === "employee") {
    throw new AppError("Employees cannot update stock", 403);
  }

  // Check if accessory exists
  const existing = await getAccessoryById(prisma, id, currentUser);

  // Manager can only update accessories in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only update accessories in your company", 403);
  }

  // Update stock
  await accessoriesRepository.update(prisma, id, { stock: Number(newStock) });

  // Return updated accessory
  const targetCompanyId = role === "developer" ? null : companyId;
  return await accessoriesRepository.findById(prisma, id, targetCompanyId);
};

/**
 * Delete accessory
 */
export const deleteAccessory = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Only developer or manager can delete
  if (role === "employee") {
    throw new AppError("Employees cannot delete accessories", 403);
  }

  // Check if accessory exists
  const existing = await getAccessoryById(prisma, id, currentUser);

  // Manager can only delete accessories in their company
  if (role === "manager" && existing.companyId !== companyId) {
    throw new AppError("You can only delete accessories in your company", 403);
  }

  // Check if accessory is used in any invoices
  const invoiceItemsCount = await prisma.invoiceItem.count({
    where: { accessoryId: id },
  });

  if (invoiceItemsCount > 0) {
    throw new AppError("Cannot delete accessory that is used in invoices", 400);
  }

  // Check if accessory is linked to any products
  const productAccessoriesCount = await prisma.productAccessory.count({
    where: { accessoryId: id },
  });

  if (productAccessoriesCount > 0) {
    throw new AppError(
      "Cannot delete accessory that is linked to products",
      400
    );
  }

  // Delete accessory
  await accessoriesRepository.deleteById(prisma, id);

  return { success: true };
};
