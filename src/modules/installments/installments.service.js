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

  // Verify invoice exists and get its details
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { customer: true },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check company access
  if (role === "manager" && invoice.companyId !== companyId) {
    throw new AppError(
      "You can only create installments for your company's invoices",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Verify it's an installment sale
  if (invoice.saleType !== "Installment") {
    throw new AppError(
      "Cannot create installment for cash sale",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Check if installment already exists
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

  // Validate dates
  const startDate = new Date(data.collectionStartDate);
  const endDate = new Date(data.collectionEndDate);

  if (startDate >= endDate) {
    throw new AppError(
      "Collection end date must be after start date",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Create installment
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

  // Check company access
  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only update installments in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Validate dates if provided
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

  // Prepare update data
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
 * Delete installment
 */
export async function deleteInstallment(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

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

  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only delete installments in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Check if there are any paid payments
  const paidPayments = installment.installmentPayments.filter(
    (p) => p.status === "Paid" || p.status === "Partial"
  );

  if (paidPayments.length > 0) {
    throw new AppError(
      "Cannot delete installment with paid payments",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  await installmentsRepository.deleteById(prisma, id);
}

// ==============================================
// INSTALLMENT PAYMENTS SERVICE
// ==============================================

/**
 * Get all installment payments
 */
export async function getAllPayments(prisma, currentUser, filters = {}) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentsRepository.findAllPayments(
    prisma,
    targetCompanyId,
    filters
  );
}

/**
 * Get payment by ID
 */
export async function getPaymentById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const payment = await installmentsRepository.findPaymentById(
    prisma,
    id,
    targetCompanyId
  );

  if (!payment) {
    throw new AppError(
      "Payment not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return payment;
}

/**
 * Count pending payments
 */
export async function countPendingPayments(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentsRepository.countPendingPayments(
    prisma,
    targetCompanyId
  );
}

/**
 * Count overdue payments
 */
export async function countOverduePayments(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await installmentsRepository.countOverduePayments(
    prisma,
    targetCompanyId
  );
}

/**
 * Create installment payment
 */
export async function createPayment(prisma, data, currentUser) {
  const { role, companyId } = currentUser;

  // Verify installment exists
  const installment = await installmentsRepository.findById(
    prisma,
    data.installmentId
  );

  if (!installment) {
    throw new AppError("Installment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check company access
  if (role === "manager" && installment.invoice.companyId !== companyId) {
    throw new AppError(
      "You can only create payments for your company's installments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Verify customer matches
  if (data.customerId !== installment.invoice.customerId) {
    throw new AppError(
      "Customer ID does not match the installment's customer",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Calculate payment status and amounts
  const amountPaid = parseFloat(data.amountPaid) || 0;
  const amountDue = parseFloat(data.amountDue);

  let status = "Pending";
  let overdueAmount = 0;
  let carryoverAmount = 0;

  if (amountPaid >= amountDue) {
    status = "Paid";
    overdueAmount = 0;
    carryoverAmount = 0;
  } else if (amountPaid > 0 && amountPaid < amountDue) {
    status = "Partial";
    overdueAmount = amountDue - amountPaid;
    carryoverAmount = overdueAmount;
  } else {
    // Check if overdue
    const dueDate = new Date(data.dueDate);
    if (dueDate < new Date()) {
      status = "Overdue";
    }
  }

  const paymentData = {
    installmentId: data.installmentId,
    customerId: data.customerId,
    amountDue,
    amountPaid,
    status,
    overdueAmount,
    carryoverAmount,
    dueDate: new Date(data.dueDate),
    paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
    notes: data.notes || null,
  };

  return await installmentsRepository.createPayment(prisma, paymentData);
}

/**
 * Update installment payment
 */
export async function updatePayment(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  const payment = await installmentsRepository.findPaymentById(prisma, id);

  if (!payment) {
    throw new AppError("Payment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check company access
  if (
    role === "manager" &&
    payment.installment.invoice.companyId !== companyId
  ) {
    throw new AppError(
      "You can only update payments in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const updateData = { ...data };

  // Recalculate status if amountPaid changed
  if (data.amountPaid !== undefined) {
    const amountPaid = parseFloat(data.amountPaid);
    const amountDue = payment.amountDue;

    if (amountPaid >= amountDue) {
      updateData.status = "Paid";
      updateData.overdueAmount = 0;
      updateData.carryoverAmount = 0;
      
      // Remove old carryover from next payment if exists
      if (payment.carryoverAmount > 0) {
        const nextPayment = await installmentsRepository.getNextPayment(
          prisma,
          payment.installmentId
        );
        if (nextPayment && nextPayment.id !== payment.id) {
          await installmentsRepository.updatePayment(prisma, nextPayment.id, {
            amountDue: Math.max(0, nextPayment.amountDue - payment.carryoverAmount),
          });
        }
      }
    } else if (amountPaid > 0) {
      updateData.status = "Partial";
      updateData.overdueAmount = amountDue - amountPaid;
      updateData.carryoverAmount = updateData.overdueAmount;

      // Add new carryover to next payment
      const nextPayment = await installmentsRepository.getNextPayment(
        prisma,
        payment.installmentId
      );
      if (nextPayment && nextPayment.id !== payment.id) {
        await installmentsRepository.updatePayment(prisma, nextPayment.id, {
          amountDue: nextPayment.amountDue + updateData.carryoverAmount,
        });
      }
    } else {
      updateData.status = "Pending";
      updateData.overdueAmount = 0;
      updateData.carryoverAmount = 0;
    }
  }

  if (data.paymentDate) {
    updateData.paymentDate = new Date(data.paymentDate);
  }

  return await installmentsRepository.updatePayment(prisma, id, updateData);
}

/**
 * Delete installment payment
 */
export async function deletePayment(prisma, id, currentUser) {
  const { role } = currentUser;

  // Only developers can delete
  if (role !== "developer") {
    throw new AppError(
      "Only developers can delete installment payments",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const payment = await installmentsRepository.findPaymentById(prisma, id);

  if (!payment) {
    throw new AppError("Payment not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Don't allow deleting paid payments
  if (payment.status === "Paid") {
    throw new AppError(
      "Cannot delete paid payment",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  await installmentsRepository.deletePayment(prisma, id);
}