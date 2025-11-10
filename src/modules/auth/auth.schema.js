export const signupSchema = {
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
  password: {
    type: "string",
    required: true,
    validate: (value) => {
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
      return true;
    },
  },
  companyName: {
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
  companyPhone: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && (typeof value !== "string" || value.length > 15)) {
        throw new Error("Invalid phone number format");
      }
      return true;
    },
  },
  companyAddress: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value && (typeof value !== "string" || value.length > 500)) {
        throw new Error("Address must be less than 500 characters");
      }
      return true;
    },
  },
  companyEmail: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Invalid company email format");
        }
      }
      return true;
    },
  },
};

export const verifyOTPSchema = {
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
  otp: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
        throw new Error("OTP must be a 6-digit number");
      }
      return true;
    },
  },
};

export const resendOTPSchema = {
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
};

export const requestPasswordResetSchema = {
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
};

export const resetPasswordSchema = {
  token: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.length !== 64) {
        throw new Error("Invalid reset token");
      }
      return true;
    },
  },
  newPassword: {
    type: "string",
    required: true,
    validate: (value) => {
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
      return true;
    },
  },
};
