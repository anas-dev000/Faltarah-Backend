import * as installmentsRepository from "./installments.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ERROR_CODES } from "../../shared/errors/errorCodes.js";

// ==============================================
// INSTALLMENTS SERVICE
// ==============================================

/**
 * Get all installments based on user role
 */
export async function getAllInstallments(prisma, currentUser) {
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

  return await installmentsRepository.findAll(prisma, targetCompanyId);
}

/**
 * Get installment by ID with access control
 */
export async function getInstallmentById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const installment = await installmentsRepository.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!installment) {
    throw new AppError(
      "Installment not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return installment;
}

/**
 * Create installment
 */
export async function createInstallment(prisma, data, currentUser) {
  const { role, companyId } = currentUser;

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { customer: true },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (role === "manager" && invoice.companyId !== companyId) {
    throw new AppError(
      "You can only create installments for your company's invoices",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (invoice.saleType !== "Installment") {
    throw new AppError(
      "Cannot create installment for cash sale",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const existingInstallment = await installmentsRepository.findByInvoiceId(
    prisma,
    data.invoiceId
  );

  if (existingInstallment) {
    throw new AppError(
      "Installment already exists for this invoice",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const startDate = new Date(data.collectionStartDate);
  const endDate = new Date(data.collectionEndDate);

  if (startDate >= endDate) {
    throw new AppError(
      "Collection end date must be after start date",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const installmentData = {
    invoiceId: data.invoiceId,
    numberOfMonths: data.numberOfMonths,
    monthlyInstallment: data.monthlyInstallment,
    collectionStartDate: startDate,
    collectionEndDate: endDate,
  };

  return await installmentsRepository.create(prisma, installmentData);
}

/**
 * Update installment
 */
export async function updateInstallment(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  const installment = await installmentsRepository.findById(prisma, id);

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only update installments in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  if (data.collectionStartDate && data.collectionEndDate) {
    const startDate = new Date(data.collectionStartDate);
    const endDate = new Date(data.collectionEndDate);

    if (startDate >= endDate) {
      throw new AppError(
        "Collection end date must be after start date",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  const updateData = { ...data };
  if (data.collectionStartDate) {
    updateData.collectionStartDate = new Date(data.collectionStartDate);
  }
  if (data.collectionEndDate) {
    updateData.collectionEndDate = new Date(data.collectionEndDate);
  }

  return await installmentsRepository.update(prisma, id, updateData);
}

/**
 * ✅ Delete installment with cascading deletion
 */
export async function deleteInstallment(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  // Only manager and developer can delete
  if (role === "employee") {
    throw new AppError(
      "Only developers and managers can delete installments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const installment = await installmentsRepository.findById(prisma, id);

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Manager can only delete installments in their company
  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only delete installments in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // ✅ Delete installment with all payments
  return await installmentsRepository.deleteByIdWithRelations(prisma, id);
}