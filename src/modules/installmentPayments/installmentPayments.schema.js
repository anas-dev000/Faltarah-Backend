// ============================================
// FILE 2: installmentPayments.schema.js
// ============================================

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = {
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
 * Schema for updating a payment
 */
export const updatePaymentSchema = {
  amountPaid: {
    type: "number",
    required: true,
    min: 0,
    message: "Amount paid must be a positive number",
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
