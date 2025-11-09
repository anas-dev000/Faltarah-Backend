/**
 * Invoices Validation Schemas
 */

/**
 * Schema for creating a new invoice
 */
export const createInvoiceSchema = {
  customerId: {
    type: "number",
    required: true,
    min: 1,
    message: "Customer ID is required and must be a positive integer",
  },
  salesRepId: {
    type: "number",
    required: true,
    min: 1,
    message: "Sales Rep ID is required",
  },
  technicianId: {
    type: "number",
    required: false,
    min: 1,
    message: "Technician ID must be a positive integer",
  },
  totalAmount: {
    type: "number",
    required: true,
    min: 0,
    message: "Total amount must be a positive number",
  },
  discountAmount: {
    type: "number",
    required: false,
    min: 0,
    default: 0,
    message: "Discount amount must be a positive number",
  },
  saleType: {
    type: "string",
    required: true,
    enum: ["Cash", "Installment"],
    message: "Sale type must be either 'Cash' or 'Installment'",
  },
  maintenancePeriod: {
    type: "number",
    required: false,
    min: 0,
    message: "Maintenance period must be a positive number (in months)",
  },
  paidAtContract: {
    type: "number",
    required: false,
    min: 0,
    default: 0,
    message: "Paid at contract must be a positive number",
  },
  paidAtInstallation: {
    type: "number",
    required: false,
    min: 0,
    default: 0,
    message: "Paid at installation must be a positive number",
  },
  installationCostType: {
    type: "string",
    required: false,
    enum: ["Percentage", "Fixed"],
    default: "Percentage",
    message: "Installation cost type must be either 'Percentage' or 'Fixed'",
  },
  installationCostValue: {
    type: "number",
    required: false,
    min: 0,
    default: 0,
    message: "Installation cost value must be a positive number",
  },
  contractDate: {
    type: "string",
    required: true,
    message: "Contract date is required (ISO format)",
  },
  installationDate: {
    type: "string",
    required: false,
    message: "Installation date must be in ISO format",
  },
  contractNotes: {
    type: "string",
    required: false,
    maxLength: 1000,
    message: "Contract notes must not exceed 1000 characters",
  },
  companyId: {
    type: "number",
    required: false,
    min: 1,
    message: "Company ID must be a positive integer",
  },
};

/**
 * Schema for updating an invoice
 */
export const updateInvoiceSchema = {
  totalAmount: {
    type: "number",
    required: false,
    min: 0,
    message: "Total amount must be a positive number",
  },
  discountAmount: {
    type: "number",
    required: false,
    min: 0,
    message: "Discount amount must be a positive number",
  },
  saleType: {
    type: "string",
    required: false,
    enum: ["Cash", "Installment"],
    message: "Sale type must be either 'Cash' or 'Installment'",
  },
  maintenancePeriod: {
    type: "number",
    required: false,
    min: 0,
    message: "Maintenance period must be a positive number",
  },
  paidAtContract: {
    type: "number",
    required: false,
    min: 0,
    message: "Paid at contract must be a positive number",
  },
  paidAtInstallation: {
    type: "number",
    required: false,
    min: 0,
    message: "Paid at installation must be a positive number",
  },
  installationCostType: {
    type: "string",
    required: false,
    enum: ["Percentage", "Fixed"],
    message: "Installation cost type must be either 'Percentage' or 'Fixed'",
  },
  installationCostValue: {
    type: "number",
    required: false,
    min: 0,
    message: "Installation cost value must be a positive number",
  },
  contractDate: {
    type: "string",
    required: false,
    message: "Contract date must be in ISO format",
  },
  installationDate: {
    type: "string",
    required: false,
    message: "Installation date must be in ISO format",
  },
  contractNotes: {
    type: "string",
    required: false,
    maxLength: 1000,
    message: "Contract notes must not exceed 1000 characters",
  },
};

/**
 * Schema for invoice ID parameter
 */
export const invoiceIdSchema = {
  id: {
    type: "number",
    required: true,
    min: 1,
    message: "Invoice ID must be a positive integer",
  },
};

/**
 * Schema for creating invoice items
 */
export const createInvoiceItemSchema = {
  invoiceId: {
    type: "number",
    required: true,
    min: 1,
    message: "Invoice ID is required",
  },
  productId: {
    type: "number",
    required: false,
    min: 1,
    message: "Product ID must be a positive integer",
  },
  accessoryId: {
    type: "number",
    required: false,
    min: 1,
    message: "Accessory ID must be a positive integer",
  },
  serviceId: {
    type: "number",
    required: false,
    min: 1,
    message: "Service ID must be a positive integer",
  },
  quantity: {
    type: "number",
    required: true,
    min: 1,
    message: "Quantity must be at least 1",
  },
  unitPrice: {
    type: "number",
    required: true,
    min: 0,
    message: "Unit price must be a positive number",
  },
};

/**
 * Schema for creating installment
 */
export const createInstallmentSchema = {
  invoiceId: {
    type: "number",
    required: true,
    min: 1,
    message: "Invoice ID is required",
  },
  numberOfMonths: {
    type: "number",
    required: true,
    min: 1,
    message: "Number of months must be at least 1",
  },
  monthlyInstallment: {
    type: "number",
    required: true,
    min: 0,
    message: "Monthly installment must be a positive number",
  },
  collectionStartDate: {
    type: "string",
    required: true,
    message: "Collection start date is required (ISO format)",
  },
  collectionEndDate: {
    type: "string",
    required: true,
    message: "Collection end date is required (ISO format)",
  },
};

/**
 * Schema for creating installment payment
 */
export const createInstallmentPaymentSchema = {
  installmentId: {
    type: "number",
    required: true,
    min: 1,
    message: "Installment ID is required",
  },
  customerId: {
    type: "number",
    required: true,
    min: 1,
    message: "Customer ID is required",
  },
  amountDue: {
    type: "number",
    required: true,
    min: 0,
    message: "Amount due must be a positive number",
  },
  amountPaid: {
    type: "number",
    required: false,
    min: 0,
    default: 0,
    message: "Amount paid must be a positive number",
  },
  dueDate: {
    type: "string",
    required: true,
    message: "Due date is required (ISO format)",
  },
  paymentDate: {
    type: "string",
    required: false,
    message: "Payment date must be in ISO format",
  },
  notes: {
    type: "string",
    required: false,
    maxLength: 500,
    message: "Notes must not exceed 500 characters",
  },
};

/**
 * Schema for updating installment payment
 */
export const updateInstallmentPaymentSchema = {
  amountPaid: {
    type: "number",
    required: false,
    min: 0,
    message: "Amount paid must be a positive number",
  },
  status: {
    type: "string",
    required: false,
    enum: ["Paid", "Partial", "Pending", "Overdue"],
    message: "Status must be one of: Paid, Partial, Pending, Overdue",
  },
  paymentDate: {
    type: "string",
    required: false,
    message: "Payment date must be in ISO format",
  },
  notes: {
    type: "string",
    required: false,
    maxLength: 500,
    message: "Notes must not exceed 500 characters",
  },
};