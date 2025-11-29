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

  let targetCompanyId;

  if (role === "developer") {
    if (!data.companyId) {
      throw new AppError(
        "Company ID is required for developers",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    targetCompanyId = data.companyId;

    const companyExists = await prisma.company.findUnique({
      where: { id: targetCompanyId },
    });

    if (!companyExists) {
      throw new AppError("Company not found", 404, ERROR_CODES.NOT_FOUND);
    }
  } else if (role === "manager") {
    targetCompanyId = companyId;
  } else {
    throw new AppError(
      "Insufficient permissions to create suppliers",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

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

  const supplier = await suppliersRepository.findById(prisma, id);

  if (!supplier) {
    throw new AppError("Supplier not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (role === "manager") {
    if (supplier.companyId !== companyId) {
      throw new AppError(
        "You can only update suppliers in your company",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  if (data.name && data.name !== supplier.name) {
    const existingSupplier = await suppliersRepository.findByNameAndCompany(
      prisma,
      data.name,
      supplier.companyId,
      id
    );

    if (existingSupplier) {
      throw new AppError(
        "Supplier name already exists in this company",
        409,
        ERROR_CODES.CONFLICT
      );
    }
  }

  return await suppliersRepository.update(prisma, id, data);
}

/**
 *  Delete supplier with cascading deletion
 */
export async function deleteSupplier(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  // Only manager and developer can delete
  if (role === "employee") {
    throw new AppError(
      "Only managers and developers can delete suppliers",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const supplier = await suppliersRepository.findById(prisma, id);

  if (!supplier) {
    throw new AppError("Supplier not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Manager can only delete suppliers in their company
  if (role === "manager" && supplier.companyId !== companyId) {
    throw new AppError(
      "You can only delete suppliers in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  //  Delete supplier with all related records
  return await suppliersRepository.deleteByIdWithRelations(prisma, id);
}
