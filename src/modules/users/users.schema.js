// ==========================================
// users.schema.js
// ==========================================

export const createUserSchema = {
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
  email: {
    type: "string",
    required: true,
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    },
  },
  password: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      // Check password strength (optional)
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        );
      }
      return true;
    },
  },
  role: {
    type: "string",
    required: true,
    validate: (value) => {
      const allowedRoles = ["developer", "manager", "employee"];
      if (!allowedRoles.includes(value)) {
        throw new Error(`Role must be one of: ${allowedRoles.join(", ")}`);
      }
      return true;
    },
  },
  status: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && !["Active", "Inactive"].includes(value)) {
        throw new Error("Status must be Active or Inactive");
      }
      return true;
    },
  },
};

export const updateUserSchema = {
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
  password: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (typeof value !== "string" || value.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          throw new Error(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          );
        }
      }
      return true;
    },
  },
  role: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        const allowedRoles = ["developer", "manager", "employee"];
        if (!allowedRoles.includes(value)) {
          throw new Error(`Role must be one of: ${allowedRoles.join(", ")}`);
        }
      }
      return true;
    },
  },
  status: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined && !["Active", "Inactive"].includes(value)) {
        throw new Error("Status must be Active or Inactive");
      }
      return true;
    },
  },
};

export const loginSchema = {
  email: {
    type: "string",
    required: true,
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    },
  },
  password: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.length === 0) {
        throw new Error("Password is required");
      }
      return true;
    },
  },
};

export const loginDevSchema = {
  email: {
    type: "string",
    required: true,
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    },
  },
  password: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.length === 0) {
        throw new Error("Password is required");
      }
      return true;
    },
  },
};

// Schema for the profile (limited to employees)
export const updateProfileSchema = {
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
  password: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value !== undefined) {
        if (typeof value !== "string" || value.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          throw new Error(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          );
        }
      }
      return true;
    },
  },
};
