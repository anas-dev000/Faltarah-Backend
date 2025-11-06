// ==========================================
// companies.schema.js
// ==========================================

export const createCompanySchema = {
  name: {
    type: "string",
    required: true,
    validate: (value) => {
      if (
        typeof value !== "string" ||
        value.trim().length < 3 ||
        value.length > 255
      ) {
        throw new Error("Company name must be between 3 and 255 characters");
      }
      return true;
    },
  },
  logo: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Logo must be a valid string URL");
      }
      if (value && value.length > 500) {
        throw new Error("Logo URL must not exceed 500 characters");
      }
      return true;
    },
  },
  address: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Address must be a string");
      }
      return true;
    },
  },
  email: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Invalid email format");
        }
      }
      return true;
    },
  },
  phone: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
        if (!phoneRegex.test(value)) {
          throw new Error("Invalid phone format (10-15 digits)");
        }
      }
      return true;
    },
  },
  subscriptionExpiryDate: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format for subscription expiry date");
        }
      }
      return true;
    },
  },
};

export const updateCompanySchema = {
  name: {
    type: "string",
    required: false,
    validate: (value) => {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.trim().length < 3 ||
          value.length > 255)
      ) {
        throw new Error("Company name must be between 3 and 255 characters");
      }
      return true;
    },
  },
  logo: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Logo must be a valid string URL");
      }
      if (value && value.length > 500) {
        throw new Error("Logo URL must not exceed 500 characters");
      }
      return true;
    },
  },
  address: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Address must be a string");
      }
      return true;
    },
  },
  email: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Invalid email format");
        }
      }
      return true;
    },
  },
  phone: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
        if (!phoneRegex.test(value)) {
          throw new Error("Invalid phone format (10-15 digits)");
        }
      }
      return true;
    },
  },
  subscriptionExpiryDate: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format for subscription expiry date");
        }
      }
      return true;
    },
  },
};

export const updateSubscriptionSchema = {
  subscriptionExpiryDate: {
    type: "string",
    required: true,
    validate: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format for subscription expiry date");
      }
      // Optional: Check if date is in the future
      if (date < new Date()) {
        throw new Error("Subscription expiry date must be in the future");
      }
      return true;
    },
  },
};
