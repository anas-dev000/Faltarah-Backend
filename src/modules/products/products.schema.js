// ==========================================
// products.schema.js
// ==========================================

export const createProductSchema = {
  name: {
    type: "string",
    required: true,
    validate: (value) => {
      if (
        typeof value !== "string" ||
        value.trim().length < 2 ||
        value.length > 255
      ) {
        throw new Error("Product name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  category: {
    type: "string",
    required: true,
    validate: (value) => {
      if (
        typeof value !== "string" ||
        value.trim().length < 2 ||
        value.length > 100
      ) {
        throw new Error("Category must be between 2 and 100 characters");
      }
      return true;
    },
  },
  price: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value <= 0) {
        throw new Error("Price must be a positive number");
      }
      // Check precision (2 decimal places)
      if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
        throw new Error("Price must have at most 2 decimal places");
      }
      return true;
    },
  },
  stock: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (!Number.isInteger(value) || value < 0) {
          throw new Error("Stock must be a non-negative integer");
        }
      }
      return true;
    },
  },
  supplierId: {
    type: "number",
    required: true,
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Supplier ID must be a positive integer");
      }
      return true;
    },
  },
  companyId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
        throw new Error("Company ID must be a positive integer");
      }
      return true;
    },
  },
  relatedAccessories: {
    type: "array",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (!Array.isArray(value)) {
          throw new Error("Related accessories must be an array of IDs");
        }
        // Validate each item is a positive integer
        for (let i = 0; i < value.length; i++) {
          if (!Number.isInteger(value[i]) || value[i] <= 0) {
            throw new Error(
              "All related accessories must be positive integers"
            );
          }
        }
      }
      return true;
    },
  },
};

export const updateProductSchema = {
  name: {
    type: "string",
    required: false,
    validate: (value) => {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.trim().length < 2 ||
          value.length > 255)
      ) {
        throw new Error("Product name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  category: {
    type: "string",
    required: false,
    validate: (value) => {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.trim().length < 2 ||
          value.length > 100)
      ) {
        throw new Error("Category must be between 2 and 100 characters");
      }
      return true;
    },
  },
  price: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (typeof value !== "number" || value <= 0) {
          throw new Error("Price must be a positive number");
        }
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
          throw new Error("Price must have at most 2 decimal places");
        }
      }
      return true;
    },
  },
  stock: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        throw new Error("Stock must be a non-negative integer");
      }
      return true;
    },
  },
  supplierId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
        throw new Error("Supplier ID must be a positive integer");
      }
      return true;
    },
  },
  relatedAccessories: {
    type: "array",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (!Array.isArray(value)) {
          throw new Error("Related accessories must be an array of IDs");
        }
        for (let i = 0; i < value.length; i++) {
          if (!Number.isInteger(value[i]) || value[i] <= 0) {
            throw new Error(
              "All related accessories must be positive integers"
            );
          }
        }
      }
      return true;
    },
  },
};

export const updateStockSchema = {
  stock: {
    type: "number",
    required: true,
    validate: (value) => {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("Stock must be a non-negative integer");
      }
      return true;
    },
  },
  operation: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const allowedOperations = ["set", "add", "subtract"];
        if (!allowedOperations.includes(value)) {
          throw new Error(
            `Operation must be one of: ${allowedOperations.join(", ")}`
          );
        }
      }
      return true;
    },
  },
};

export const productQuerySchema = {
  category: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && value.length > 100) {
        throw new Error("Category must not exceed 100 characters");
      }
      return true;
    },
  },
  supplierId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
        throw new Error("Supplier ID must be a positive integer");
      }
      return true;
    },
  },
  minPrice: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "number" || value <= 0)) {
        throw new Error("Minimum price must be a positive number");
      }
      return true;
    },
  },
  maxPrice: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "number" || value <= 0)) {
        throw new Error("Maximum price must be a positive number");
      }
      return true;
    },
  },
  lowStock: {
    type: "boolean",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "boolean") {
        throw new Error("Low stock must be a boolean value");
      }
      return true;
    },
  },
  stockThreshold: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
        throw new Error("Stock threshold must be a positive integer");
      }
      return true;
    },
  },
  page: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error("Page must be an integer greater than or equal to 1");
      }
      return true;
    },
  },
  limit: {
    type: "number",
    required: false,
    validate: (value) => {
      if (
        value !== undefined &&
        (!Number.isInteger(value) || value < 1 || value > 100)
      ) {
        throw new Error("Limit must be an integer between 1 and 100");
      }
      return true;
    },
  },
  sortBy: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const allowedFields = [
          "name",
          "price",
          "stock",
          "category",
          "createdAt",
        ];
        if (!allowedFields.includes(value)) {
          throw new Error(`Sort by must be one of: ${allowedFields.join(", ")}`);
        }
      }
      return true;
    },
  },
  sortOrder: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const allowedOrders = ["asc", "desc"];
        if (!allowedOrders.includes(value)) {
          throw new Error(`Sort order must be one of: ${allowedOrders.join(", ")}`);
        }
      }
      return true;
    },
  },
};

export const productIdSchema = {
  id: {
    type: "number",
    required: true,
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Product ID must be a positive integer");
      }
      return true;
    },
  },
};