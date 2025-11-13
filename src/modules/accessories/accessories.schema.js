// ==========================================
// accessories.schema.js
// ==========================================

export const createAccessorySchema = {
  name: {
    type: "string",
    required: true,
    validate: (value) => {
      if (
        typeof value !== "string" ||
        value.trim().length < 2 ||
        value.length > 255
      ) {
        throw new Error("Accessory name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  // category: {
  //   type: "string",
  //   required: false,
  //   validate: (value) => {
  //     if (
  //       value !== undefined &&
  //       value !== null &&
  //       (typeof value !== "string" ||
  //         value.trim().length < 2 ||
  //         value.length > 100)
  //     ) {
  //       throw new Error("Category must be between 2 and 100 characters");
  //     }
  //     return true;
  //   },
  // },
  price: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value < 0) {
        throw new Error("Price must be a non-negative number");
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
};

export const updateAccessorySchema = {
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
        throw new Error("Accessory name must be between 2 and 255 characters");
      }
      return true;
    },
  },
  // category: {
  //   type: "string",
  //   required: false,
  //   validate: (value) => {
  //     if (
  //       value !== undefined &&
  //       value !== null &&
  //       (typeof value !== "string" ||
  //         value.trim().length < 2 ||
  //         value.length > 100)
  //     ) {
  //       throw new Error("Category must be between 2 and 100 characters");
  //     }
  //     return true;
  //   },
  // },
  price: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "number" || value < 0)) {
        throw new Error("Price must be a non-negative number");
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
};

export const accessoryIdSchema = {
  id: {
    type: "number",
    required: true,
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Accessory ID must be a positive integer");
      }
      return true;
    },
  },
};