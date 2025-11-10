export const createServiceSchema = {
  name: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.trim().length < 3 || value.length > 255) {
        throw new Error("Service name must be between 3 and 255 characters");
      }
      return true;
    },
  },
  description: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Description must be a string");
      }
      return true;
    },
  },
  price: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value < 0) {
        throw new Error("Price must be a positive number");
      }
      return true;
    },
  }
};

export const updateServiceSchema = {
  name: { type: "string", required: false },
  description: { type: "string", required: false },
  price: { type: "number", required: false },
  companyId: { type: "number", required: false },
};
