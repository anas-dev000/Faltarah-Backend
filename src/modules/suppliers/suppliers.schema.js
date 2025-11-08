/**
 * Suppliers Validation Schemas
 */

/**
 * Schema for creating a new supplier
 */
export const createSupplierSchema = {
  name: {
    type: "string",
    required: true,
    minLength: 3,
    maxLength: 255,
    trim: true,
    message: "Name must be between 3 and 255 characters",
  },
  contactInfo: {
    type: "string",
    required: true,
    minLength: 5,
    trim: true,
    message: "Contact info is required (minimum 5 characters)",
  },
  companyId: {
    type: "number",
    required: false,
    min: 1,
    message: "Company ID must be a positive integer",
  },
};

/**
 * Schema for updating a supplier
 */
export const updateSupplierSchema = {
  name: {
    type: "string",
    required: false,
    minLength: 3,
    maxLength: 255,
    trim: true,
    message: "Name must be between 3 and 255 characters",
  },
  contactInfo: {
    type: "string",
    required: false,
    minLength: 5,
    trim: true,
    message: "Contact info must be at least 5 characters",
  },
};

/**
 * Schema for supplier ID parameter
 */
export const supplierIdSchema = {
  id: {
    type: "number",
    required: true,
    min: 1,
    message: "Supplier ID must be a positive integer",
  },
};
