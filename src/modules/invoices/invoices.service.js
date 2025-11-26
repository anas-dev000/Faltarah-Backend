import * as invoicesRepository from "./invoices.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ERROR_CODES } from "../../shared/errors/errorCodes.js";

// ==============================================
// INVOICES SERVICE
// ==============================================

/**
 * Get all invoices based on user role
 */
export async function getAllInvoices(
  prisma,
  currentUser,
  filters = {},
  page = 1,
  limit = 10
) {
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

  const skip = (page - 1) * limit;
  const take = limit;

  return await invoicesRepository.findAll(
    prisma,
    targetCompanyId,
    filters,
    skip,
    take
  );
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
 *  Create new invoice with correct calculations
 */
export async function createInvoice(prisma, data, currentUser) {
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
      "Insufficient permissions to create invoices",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

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

  // ==========================================
  //  CORRECT CALCULATION LOGIC
  // ==========================================

  // 1️⃣ الإجمالي الفرعي (من المنتجات فقط)
  const subtotal = parseFloat(data.totalAmount);

  // 2️⃣ قيمة الخصم
  const discountAmount = parseFloat(data.discountAmount || 0);

  // 3️⃣ حساب تكلفة التركيب بناءً على النوع
  const installationCostValue = parseFloat(data.installationCostValue || 0);
  let actualInstallationCost = 0;

  if (data.installationCostType === "Percentage") {
    // إذا كانت نسبة مئوية، نحسبها من الإجمالي الفرعي
    actualInstallationCost = (subtotal * installationCostValue) / 100;
  } else {
    // إذا كانت مبلغ ثابت
    actualInstallationCost = installationCostValue;
  }

  // 4️⃣ الإجمالي النهائي = الإجمالي الفرعي - الخصم + تكلفة التركيب
  const finalTotal = subtotal - discountAmount + actualInstallationCost;

  // 5️⃣ المدفوعات
  const paidAtContract = parseFloat(data.paidAtContract || 0);
  const paidAtInstallation = parseFloat(data.paidAtInstallation || 0);
  const totalPaid = paidAtContract + paidAtInstallation;

  //  التحقق من أن المبالغ المدفوعة لا تتجاوز الإجمالي النهائي
  if (totalPaid > finalTotal) {
    throw new AppError(
      `Total paid (${totalPaid.toFixed(
        2
      )}) exceeds final total (${finalTotal.toFixed(
        2
      )}). Subtotal: ${subtotal}, Discount: ${discountAmount}, Installation: ${actualInstallationCost}`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  //  التحقق الخاص بالبيع النقدي
  if (data.saleType === "Cash") {
    if (Math.abs(totalPaid - finalTotal) > 0.01) {
      // للسماح بفروق التقريب
      throw new AppError(
        `For cash sales, total paid (${totalPaid.toFixed(
          2
        )}) must equal final total (${finalTotal.toFixed(2)})`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  // ==========================================
  //  CREATE INVOICE WITH CORRECT VALUES
  // ==========================================
  const invoiceData = {
    customerId: data.customerId,
    salesRepId: data.salesRepId,
    technicianId: data.technicianId,
    companyId: targetCompanyId,

    //  نحفظ الإجمالي النهائي (بعد الخصم والتركيب)
    totalAmount: finalTotal,

    //  نحفظ قيمة الخصم بشكل منفصل
    discountAmount: discountAmount,

    saleType: data.saleType,
    maintenancePeriod: data.maintenancePeriod,
    paidAtContract: paidAtContract,
    paidAtInstallation: paidAtInstallation,

    //  نحفظ نوع وقيمة التركيب بشكل منفصل للشفافية
    installationCostType: data.installationCostType,
    installationCostValue: data.installationCostValue,

    contractDate: new Date(data.contractDate),
    installationDate: data.installationDate
      ? new Date(data.installationDate)
      : null,
    contractNotes: data.contractNotes || "",
  };

  console.log("📊 Invoice Calculation Debug:", {
    subtotal,
    discountAmount,
    installationCostType: data.installationCostType,
    installationCostValue,
    actualInstallationCost,
    finalTotal,
    paidAtContract,
    paidAtInstallation,
    totalPaid,
  });

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
 *  Delete invoice with cascading deletion
 */
export async function deleteInvoice(prisma, id, currentUser) {
  const { role, companyId } = currentUser;

  // Only manager and developer can delete
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

  // Manager can only delete invoices in their company
  if (role === "manager" && invoice.companyId !== companyId) {
    throw new AppError(
      "You can only delete invoices in your company",
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  //  Delete invoice with all relations
  return await invoicesRepository.deleteByIdWithRelations(prisma, id);
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
 * Create invoice item WITH STOCK DEDUCTION
 */
export async function createInvoiceItem(prisma, data, currentUser) {
  const invoice = await getInvoiceById(prisma, data.invoiceId, currentUser);

  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError("Product not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (product.stock < data.quantity) {
      throw new AppError(
        `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${data.quantity}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        stock: {
          decrement: data.quantity,
        },
      },
    });
  }

  if (data.accessoryId) {
    const accessory = await prisma.accessory.findUnique({
      where: { id: data.accessoryId },
    });

    if (!accessory) {
      throw new AppError("Accessory not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (accessory.stock < data.quantity) {
      throw new AppError(
        `Insufficient stock for accessory "${accessory.name}". Available: ${accessory.stock}, Requested: ${data.quantity}`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await prisma.accessory.update({
      where: { id: data.accessoryId },
      data: {
        stock: {
          decrement: data.quantity,
        },
      },
    });
  }

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
