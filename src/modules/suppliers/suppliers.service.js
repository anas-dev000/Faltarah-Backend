import * as supplierRepo from "./suppliers.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Get all suppliers based on user role
 */
export const getAllSuppliers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "developer") {
    return supplierRepo.findAllSuppliers(prisma, null);
  }

  if (role === "manager" || role === "employee") {
    return supplierRepo.findAllSuppliers(prisma, companyId);
  }

  throw new AppError("Forbidden: Invalid role", 403);
};

/**
 * Get supplier by ID with access control
 */
export const getSupplierById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const supplier = await supplierRepo.findSupplierById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!supplier) {
    throw new AppError("Supplier not found or access denied", 404);
  }

  return supplier;
};

/**
 * Create new supplier
 */
export const createNewSupplier = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot create suppliers", 403);
  }

  let targetCompanyId = data.companyId;

  if (role === "manager") {
    if (data.companyId !== companyId) {
      throw new AppError("Forbidden: You can only create suppliers for your company", 403);
    }
    targetCompanyId = companyId;
  }

  // Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: targetCompanyId },
  });
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // Check duplicate name in company
  const nameExists = await supplierRepo.isSupplierNameExistsInCompany(
    prisma,
    data.name,
    targetCompanyId
  );
  if (nameExists) {
    throw new AppError("Supplier name already exists in this company", 409);
  }

  const supplierData = {
    name: data.name.trim(),
    contactInfo: data.contactInfo,
    companyId: targetCompanyId,
  };

  return supplierRepo.createSupplier(prisma, supplierData);
};

/**
 * Update existing supplier
 */
export const updateExistingSupplier = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot update suppliers", 403);
  }

  const targetSupplier = await supplierRepo.findSupplierById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!targetSupplier) {
    throw new AppError("Supplier not found or access denied", 404);
  }

  // Prevent company change except by developer
  if (data.companyId && role !== "developer") {
    throw new AppError("Forbidden: Cannot change supplier company", 403);
  }

  // Check name uniqueness if changed
  if (data.name && data.name.trim() !== targetSupplier.name) {
    const nameExists = await supplierRepo.isSupplierNameExistsInCompany(
      prisma,
      data.name.trim(),
      targetSupplier.companyId,
      id
    );
    if (nameExists) {
      throw new AppError("Supplier name already exists in this company", 409);
    }
  }

  const updateData = {
    ...(data.name && { name: data.name.trim() }),
    ...(data.contactInfo && { contactInfo: data.contactInfo }),
  };

  return supplierRepo.updateSupplier(
    prisma,
    id,
    updateData,
    role === "developer" ? null : companyId
  );
};

/**
 * Delete supplier
 */
export const deleteExistingSupplier = async (prisma, id, currentUser) => {
  const { role } = currentUser;

  if (role !== "developer" && role !== "manager") {
    throw new AppError("Forbidden: Only managers and developers can delete suppliers", 403);
  }

  const supplier = await supplierRepo.findSupplierById(
    prisma,
    id,
    role === "developer" ? null : currentUser.companyId
  );

  if (!supplier) {
    throw new AppError("Supplier not found or access denied", 404);
  }

  await supplierRepo.deleteSupplier(prisma, id, role === "developer" ? null : currentUser.companyId);
};