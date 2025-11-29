// ==========================================
// subscriptions.schema.js
// ==========================================

export const createCheckoutSchema = {
  planId: {
    type: "number",
    required: true,
    validate: (value) => {
      //  More detailed validation
      if (value === undefined || value === null) {
        throw new Error("Plan ID is required");
      }

      if (typeof value !== "number") {
        throw new Error(`Plan ID must be a number, received ${typeof value}`);
      }

      if (value <= 0) {
        throw new Error("Plan ID must be positive");
      }

      if (!Number.isInteger(value)) {
        throw new Error("Plan ID must be an integer");
      }

      return true;
    },
  },
  companyId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value === undefined || value === null) {
        return true; // Optional field
      }

      if (typeof value !== "number") {
        throw new Error(
          `Company ID must be a number, received ${typeof value}`
        );
      }

      if (value <= 0) {
        throw new Error("Company ID must be positive");
      }

      if (!Number.isInteger(value)) {
        throw new Error("Company ID must be an integer");
      }

      return true;
    },
  },
};

//  Enhanced validation middleware
export const validateCheckoutRequest = (request, reply, done) => {
  const { planId, companyId } = request.body;

  const errors = {};

  // Validate planId
  try {
    createCheckoutSchema.planId.validate(planId);
  } catch (error) {
    errors.planId = error.message;
  }

  // Validate companyId if provided
  if (companyId !== undefined) {
    try {
      createCheckoutSchema.companyId.validate(companyId);
    } catch (error) {
      errors.companyId = error.message;
    }
  }

  if (Object.keys(errors).length > 0) {
    console.error("❌ Validation errors:", errors);
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: errors,
    });
  }

  done();
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
