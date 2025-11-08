import * as suppliersRepository from "./suppliers.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ERROR_CODES } from "../../shared/errors/errorCodes.js";

/**
 * Get all suppliers based on user role
 * - Developer: sees all suppliers
 * - Manager/Employee: sees only their company's suppliers
 */
export async function getAllSuppliers(prisma, currentUser, filters = {}) {
  const { role, companyId } = currentUser;

  // Determine target company based on role
  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    if (!companyId) {
      throw new AppError(
        "Company ID is required for managers and employees",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    targetCompanyId = companyId;
  }
  // Developer (role === "developer") sees all companies (targetCompanyId = null)

  return await suppliersRepository.findAll(prisma, targetCompanyId, filters);
}

/**
 * Search suppliers by name or contact info
 */
export async function searchSuppliers(prisma, searchTerm, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    if (!companyId) {
      throw new AppError(
        "Company ID is required for managers and employees",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    targetCompanyId = companyId;
  }

  return await suppliersRepository.searchByNameOrContact(
    prisma,
    searchTerm,
    targetCompanyId
  );
}

/**
 * Get supplier by ID with access control
 */
export async function getSupplierById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const supplier = await suppliersRepository.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!supplier) {
    throw new AppError(
      "Supplier not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return supplier;
}

/**
 * Create new supplier
 * - Developer: can create for any company
 * - Manager: can only create for their company
 * - Employee: cannot create (blocked by middleware)
 */
export async function createSupplier(prisma, data, currentUser) {
  const { role, companyId } = currentUser;

  // Determine target company ID
  let targetCompanyId;

  if (role === "developer") {
    // Developer must provide companyId
    if (!data.companyId) {
      throw new AppError(
        "Company ID is required for developers",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    targetCompanyId = data.companyId;

    // Verify company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: targetCompanyId },
    });

    if (!companyExists) {
      throw new AppError("Company not found", 404, ERROR_CODES.NOT_FOUND);
    }
  } else if (role === "manager") {
    // Manager creates for their own company only
    targetCompanyId = companyId;
  } else {
    throw new AppError(
      "Insufficient permissions to create suppliers",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Check if supplier name already exists in the company
  const existingSupplier = await suppliersRepository.findByNameAndCompany(
    prisma,
    data.name,
    targetCompanyId
  );

  if (existingSupplier) {
    throw new AppError(
      "Supplier name already exists in this company",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  // Create supplier
  const supplierData = {
    name: data.name,
    contactInfo: data.contactInfo,
    companyId: targetCompanyId,
  };

  return await suppliersRepository.create(prisma, supplierData);
}

/**
 * Update supplier
 * - Developer: can update any supplier
 * - Manager: can only update suppliers in their company
 * - Employee: cannot update (blocked by middleware)
 */
export async function updateSupplier(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  // First, get the supplier to check ownership
  const supplier = await suppliersRepository.findById(prisma, id);

  if (!supplier) {
    throw new AppError("Supplier not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check access based on role
  if (role === "manager") {
    if (supplier.companyId !== companyId) {
      throw new AppError(
        "You can only update suppliers in your company",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }
  // Developer can update any supplier

  // Check name uniqueness if name is being changed
  if (data.name && data.name !== supplier.name) {
    const existingSupplier = await suppliersRepository.findByNameAndCompany(
      prisma,
      data.name,
      supplier.companyId,
      id // Exclude current supplier
    );

    if (existingSupplier) {
      throw new AppError(
        "Supplier name already exists in this company",
        409,
        ERROR_CODES.CONFLICT
      );
    }
  }

  // Update supplier
  return await suppliersRepository.update(prisma, id, data);
}

/**
 * Delete supplier
 * - Developer only
 * - Cannot delete if supplier has related products or accessories
 */
export async function deleteSupplier(prisma, id, currentUser) {
  const { role } = currentUser;

  // employee cannot delete
  if (role === "employee") {
    throw new AppError(
      "Only developers can delete suppliers",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Check if supplier exists
  const supplier = await suppliersRepository.findById(prisma, id);

  if (!supplier) {
    throw new AppError("Supplier not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check for related records
  const relationsCheck = await suppliersRepository.checkSupplierRelations(
    prisma,
    id
  );

  if (relationsCheck.hasRelations) {
    const { products, accessories } = relationsCheck.counts;
    const relatedItems = [];

    if (products > 0) relatedItems.push(`${products} product(s)`);
    if (accessories > 0) relatedItems.push(`${accessories} accessory(ies)`);

    throw new AppError(
      `Cannot delete supplier. It has ${relatedItems.join(
        " and "
      )}. Please remove these items first.`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if supplier belongs to the current company
  if (supplier.companyId !== currentUser.companyId) {
    throw new AppError(
      "You can only delete suppliers in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Delete supplier
  await suppliersRepository.deleteById(prisma, id);
}
