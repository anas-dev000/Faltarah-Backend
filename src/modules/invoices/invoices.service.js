import * as invoicesRepository from "./invoices.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ERROR_CODES } from "../../shared/errors/errorCodes.js";

// ==============================================
// INVOICES SERVICE
// ==============================================

/**
 * Get all invoices based on user role
 */
export async function getAllInvoices(prisma, currentUser, filters = {}) {
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

  return await invoicesRepository.findAll(prisma, targetCompanyId, filters);
}

/**
 * Get invoice by ID with access control
 */
export async function getInvoiceById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const invoice = await invoicesRepository.findById(
    prisma,
    id,
    targetCompanyId
  );

  if (!invoice) {
    throw new AppError(
      "Invoice not found or access denied",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  return invoice;
}

/**
 * Get recent invoices
 */
export async function getRecentInvoices(prisma, currentUser, limit = 5) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await invoicesRepository.getRecentInvoices(
    prisma,
    targetCompanyId,
    limit
  );
}

/**
 * Calculate monthly revenue
 */
export async function getMonthlyRevenue(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await invoicesRepository.calculateMonthlyRevenue(
    prisma,
    targetCompanyId
  );
}

/**
 * Create new invoice
 */
export async function createInvoice(prisma, data, currentUser) {
  const { role, companyId } = currentUser;

  // Determine target company ID
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
      "Insufficient permissions to create invoices",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  // Verify customer exists and belongs to company
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      companyId: targetCompanyId,
    },
  });

  if (!customer) {
    throw new AppError(
      "Customer not found or does not belong to this company",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  // Verify sales rep exists
  const salesRep = await prisma.employee.findFirst({
    where: {
      id: data.salesRepId,
      companyId: targetCompanyId,
      role: "SalesRep",
    },
  });

  if (!salesRep) {
    throw new AppError(
      "Sales representative not found",
      404,
      ERROR_CODES.NOT_FOUND
    );
  }

  // Verify technician if provided
  if (data.technicianId) {
    const technician = await prisma.employee.findFirst({
      where: {
        id: data.technicianId,
        companyId: targetCompanyId,
        role: "Technician",
      },
    });

    if (!technician) {
      throw new AppError("Technician not found", 404, ERROR_CODES.NOT_FOUND);
    }
  }

  // Create invoice
  const invoiceData = {
    ...data,
    companyId: targetCompanyId,
    contractDate: new Date(data.contractDate),
    installationDate: data.installationDate
      ? new Date(data.installationDate)
      : null,
  };

  return await invoicesRepository.create(prisma, invoiceData);
}

/**
 * Update invoice
 */
export async function updateInvoice(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  const invoice = await invoicesRepository.findById(prisma, id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (role === "manager") {
    if (invoice.companyId !== companyId) {
      throw new AppError(
        "You can only update invoices in your company",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  // Prepare update data
  const updateData = { ...data };
  if (data.contractDate) {
    updateData.contractDate = new Date(data.contractDate);
  }
  if (data.installationDate) {
    updateData.installationDate = new Date(data.installationDate);
  }

  return await invoicesRepository.update(prisma, id, updateData);
}

/**
 * Delete invoice
 */
export async function deleteInvoice(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError(
      "Only developers and managers can delete invoices",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  const invoice = await invoicesRepository.findById(prisma, id);

  if (!invoice) {
    throw new AppError("Invoice not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (role === "manager" && invoice.companyId !== companyId) {
    throw new AppError(
      "You can only delete invoices in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  await invoicesRepository.deleteById(prisma, id);
}

// ==============================================
// INVOICE ITEMS SERVICE
// ==============================================

/**
 * Get invoice items for an invoice
 */
export async function getInvoiceItems(prisma, invoiceId, currentUser) {
  const invoice = await getInvoiceById(prisma, invoiceId, currentUser);
  return await invoicesRepository.findInvoiceItems(prisma, invoiceId);
}

/**
 * Create invoice item
 */
export async function createInvoiceItem(prisma, data, currentUser) {
  const invoice = await getInvoiceById(prisma, data.invoiceId, currentUser);

  const subtotal = data.quantity * data.unitPrice;

  const itemData = {
    ...data,
    subtotal,
    companyId: invoice.companyId,
  };

  return await invoicesRepository.createInvoiceItem(prisma, itemData);
}

/**
 * Update invoice item
 */
export async function updateInvoiceItem(prisma, id, data, currentUser) {
  const item = await prisma.invoiceItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError("Invoice item not found", 404, ERROR_CODES.NOT_FOUND);
  }

  await getInvoiceById(prisma, item.invoiceId, currentUser);

  const updateData = { ...data };
  if (data.quantity !== undefined || data.unitPrice !== undefined) {
    const quantity = data.quantity ?? item.quantity;
    const unitPrice = data.unitPrice ?? item.unitPrice;
    updateData.subtotal = quantity * unitPrice;
  }

  return await invoicesRepository.updateInvoiceItem(prisma, id, updateData);
}

/**
 * Delete invoice item
 */
export async function deleteInvoiceItem(prisma, id, currentUser) {
  const item = await prisma.invoiceItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError("Invoice item not found", 404, ERROR_CODES.NOT_FOUND);
  }

  await getInvoiceById(prisma, item.invoiceId, currentUser);

  await invoicesRepository.deleteInvoiceItem(prisma, id);
}

// ==============================================
// INSTALLMENTS SERVICE
// ==============================================

/**
 * Get all installments
 */
export async function getAllInstallments(prisma, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await invoicesRepository.findAllInstallments(prisma, targetCompanyId);
}

/**
 * Get installment by ID
 */
export async function getInstallmentById(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const installment = await invoicesRepository.findInstallmentById(
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
  const invoice = await getInvoiceById(prisma, data.invoiceId, currentUser);

  if (invoice.saleType !== "Installment") {
    throw new AppError(
      "Cannot create installment for cash sale",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const existingInstallment =
    await invoicesRepository.findInstallmentByInvoiceId(prisma, data.invoiceId);

  if (existingInstallment) {
    throw new AppError(
      "Installment already exists for this invoice",
      409,
      ERROR_CODES.CONFLICT
    );
  }

  const installmentData = {
    ...data,
    collectionStartDate: new Date(data.collectionStartDate),
    collectionEndDate: new Date(data.collectionEndDate),
  };

  return await invoicesRepository.createInstallment(prisma, installmentData);
}

/**
 * Update installment
 */
export async function updateInstallment(prisma, id, data, currentUser) {
  const installment = await getInstallmentById(prisma, id, currentUser);

  const updateData = { ...data };
  if (data.collectionStartDate) {
    updateData.collectionStartDate = new Date(data.collectionStartDate);
  }
  if (data.collectionEndDate) {
    updateData.collectionEndDate = new Date(data.collectionEndDate);
  }

  return await invoicesRepository.updateInstallment(prisma, id, updateData);
}

/**
 * Delete installment
 */
export async function deleteInstallment(prisma, id, currentUser) {
  await getInstallmentById(prisma, id, currentUser);
  await invoicesRepository.deleteInstallment(prisma, id);
}

// ==============================================
// INSTALLMENT PAYMENTS SERVICE
// ==============================================

/**
 * Get all installment payments
 */
export async function getAllInstallmentPayments(
  prisma,
  currentUser,
  filters = {}
) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  return await invoicesRepository.findAllInstallmentPayments(
    prisma,
    targetCompanyId,
    filters
  );
}


/**
 * Create installment payment
 */
export async function createInstallmentPayment(prisma, data, currentUser) {
  const installment = await getInstallmentById(
    prisma,
    data.installmentId,
    currentUser
  );

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

  return await invoicesRepository.createInstallmentPayment(prisma, paymentData);
}

/**
 * Update installment payment
 */
export async function updateInstallmentPayment(prisma, id, data, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const payment = await invoicesRepository.findInstallmentPaymentById(
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

  const updateData = { ...data };

  // Recalculate status if amountPaid changed
  if (data.amountPaid !== undefined) {
    const amountPaid = parseFloat(data.amountPaid);
    const amountDue = payment.amountDue;

    if (amountPaid >= amountDue) {
      updateData.status = "Paid";
      updateData.overdueAmount = 0;
      updateData.carryoverAmount = 0;
    } else if (amountPaid > 0) {
      updateData.status = "Partial";
      updateData.overdueAmount = amountDue - amountPaid;
      updateData.carryoverAmount = updateData.overdueAmount;
    } else {
      updateData.status = "Pending";
      updateData.overdueAmount = 0;
      updateData.carryoverAmount = 0;
    }
  }

  if (data.paymentDate) {
    updateData.paymentDate = new Date(data.paymentDate);
  }

  return await invoicesRepository.updateInstallmentPayment(
    prisma,
    id,
    updateData
  );
}

/**
 * Delete installment payment
 */
export async function deleteInstallmentPayment(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  let targetCompanyId = null;
  if (role === "manager" || role === "employee") {
    targetCompanyId = companyId;
  }

  const payment = await invoicesRepository.findInstallmentPaymentById(
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

  await invoicesRepository.deleteInstallmentPayment(prisma, id);
}
