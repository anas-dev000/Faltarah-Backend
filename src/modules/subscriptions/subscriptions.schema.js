// ==========================================
// subscriptions.schema.js
// ==========================================

export const createCheckoutSchema = {
  planId: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value <= 0) {
        throw new Error("Valid plan ID is required");
      }
      return true;
    },
  },
  companyId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "number" || value <= 0)) {
        throw new Error("Valid company ID is required");
      }
      return true;
    },
  },
};

export const processCashPaymentSchema = {
  companyId: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value <= 0) {
        throw new Error("Valid company ID is required");
      }
      return true;
    },
  },
  planId: {
    type: "number",
    required: true,
    validate: (value) => {
      if (typeof value !== "number" || value <= 0) {
        throw new Error("Valid plan ID is required");
      }
      return true;
    },
  },
  notes: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Notes must be a string");
      }
      return true;
    },
  },
};

export const cancelSubscriptionSchema = {
  reason: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && typeof value !== "string") {
        throw new Error("Reason must be a string");
      }
      if (value && value.length > 500) {
        throw new Error("Reason must not exceed 500 characters");
      }
      return true;
    },
  },
};

export const markAlertsReadSchema = {
  alertIds: {
    type: "array",
    required: true,
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Alert IDs array is required");
      }
      if (!value.every((id) => typeof id === "number" && id > 0)) {
        throw new Error("All alert IDs must be valid numbers");
      }
      return true;
    },
  },
};
