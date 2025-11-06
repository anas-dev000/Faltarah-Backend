// ==========================================
// customers.schema.js
// ==========================================

/**
 * Schema for creating a new customer
 */
export const createCustomerSchema = {
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
  fullName: {
    type: "string",
    required: true,
    validate: (value) => {
      if (
        typeof value !== "string" ||
        value.trim().length < 3 ||
        value.length > 100
      ) {
        throw new Error("Full name must be between 3 and 100 characters");
      }
      return true;
    },
  },
  nationalId: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!/^[0-9]{14}$/.test(value)) {
        throw new Error("National ID must be a 14-digit number");
      }
      return true;
    },
  },
  customerType: {
    type: "string",
    required: true,
    validate: (value) => {
      const allowedTypes = ["Installation", "Maintenance"];
      if (!allowedTypes.includes(value)) {
        throw new Error(`Customer type must be one of: ${allowedTypes.join(", ")}`);
      }
      return true;
    },
  },
  idCardImage: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(value)) {
        throw new Error("Invalid ID card image URL");
      }
      return true;
    },
  },
  primaryNumber: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!/^[0-9]{10,15}$/.test(value)) {
        throw new Error("Primary number must be a valid phone number");
      }
      return true;
    },
  },
  secondaryNumber: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^[0-9]{10,15}$/.test(value)) {
        throw new Error("Secondary number must be a valid phone number");
      }
      return true;
    },
  },
  governorate: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!value || typeof value !== "string") {
        throw new Error("Governorate is required");
      }
      return true;
    },
  },
  city: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!value || typeof value !== "string") {
        throw new Error("City is required");
      }
      return true;
    },
  },
  district: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!value || typeof value !== "string") {
        throw new Error("District is required");
      }
      return true;
    },
  },
};

/**
 * Schema for updating an existing customer
 */
export const updateCustomerSchema = {
  fullName: {
    type: "string",
    required: false,
    validate: (value) => {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.trim().length < 3 ||
          value.length > 100)
      ) {
        throw new Error("Full name must be between 3 and 100 characters");
      }
      return true;
    },
  },
  nationalId: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^[0-9]{14}$/.test(value)) {
        throw new Error("National ID must be a 14-digit number");
      }
      return true;
    },
  },
  customerType: {
    type: "string",
    required: false,
    validate: (value) => {
      const allowedTypes = ["Installation", "Maintenance"];
      if (value && !allowedTypes.includes(value)) {
        throw new Error(`Customer type must be one of: ${allowedTypes.join(", ")}`);
      }
      return true;
    },
  },
  idCardImage: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(value)) {
        throw new Error("Invalid ID card image URL");
      }
      return true;
    },
  },
  primaryNumber: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^[0-9]{10,15}$/.test(value)) {
        throw new Error("Primary number must be a valid phone number");
      }
      return true;
    },
  },
  secondaryNumber: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !/^[0-9]{10,15}$/.test(value)) {
        throw new Error("Secondary number must be a valid phone number");
      }
      return true;
    },
  },
  governorate: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && typeof value !== "string") {
        throw new Error("Governorate must be a valid string");
      }
      return true;
    },
  },
  city: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && typeof value !== "string") {
        throw new Error("City must be a valid string");
      }
      return true;
    },
  },
  district: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && typeof value !== "string") {
        throw new Error("District must be a valid string");
      }
      return true;
    },
  },
  address: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && typeof value !== "string") {
        throw new Error("Address must be a valid string");
      }
      return true;
    },
  },
  notes: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && typeof value !== "string") {
        throw new Error("Notes must be a valid string");
      }
      return true;
    },
  },
  isActive: {
    type: "boolean",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "boolean") {
        throw new Error("isActive must be true or false");
      }
      return true;
    },
  },
};
