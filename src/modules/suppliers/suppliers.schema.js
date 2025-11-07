export const createSupplierSchema = {
  companyId: {
    type: "number",
    required: true,
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Company ID must be a positive integer");
      }
      return true;
    },
  },
  name: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.trim().length < 2 || value.length > 255) {
        throw new Error("Supplier name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  contactInfo: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Contact info is required");
      }
      return true;
    },
  },
};

export const updateSupplierSchema = {
  name: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "string" || value.trim().length < 2 || value.length > 255)) {
        throw new Error("Supplier name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  contactInfo: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "string" || value.trim().length === 0)) {
        throw new Error("Contact info cannot be empty");
      }
      return true;
    },
  },
};