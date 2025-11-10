/**
 * Installments Validation Schemas
 */

/**
 * Schema for creating a new installment
 */
export const createInstallmentSchema = {
  invoiceId: {
    type: "number",
    required: true,
    min: 1,
    message: "Invoice ID is required and must be a positive integer",
  },
  numberOfMonths: {
    type: "number",
    required: true,
    min: 1,
    max: 60,
    message: "Number of months must be between 1 and 60",
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
 * Schema for updating an installment
 */
export const updateInstallmentSchema = {
  numberOfMonths: {
    type: "number",
    required: false,
    min: 1,
    max: 60,
    message: "Number of months must be between 1 and 60",
  },
  monthlyInstallment: {
    type: "number",
    required: false,
    min: 0,
    message: "Monthly installment must be a positive number",
  },
  collectionStartDate: {
    type: "string",
    required: false,
    message: "Collection start date must be in ISO format",
  },
  collectionEndDate: {
    type: "string",
    required: false,
    message: "Collection end date must be in ISO format",
  },
};

/**
 * Schema for installment ID parameter
 */
export const installmentIdSchema = {
  id: {
    type: "number",
    required: true,
    min: 1,
    message: "Installment ID must be a positive integer",
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

/**
 * Schema for payment ID parameter
 */
export const paymentIdSchema = {
  id: {
    type: "number",
    required: true,
    min: 1,
    message: "Payment ID must be a positive integer",
  },
};