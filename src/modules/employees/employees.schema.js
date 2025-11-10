// ==========================================
// employee.schema.js
// ==========================================

export const createEmployeeSchema = {
  companyId: {
    type: "number",
    required: true,
    validate: (v) => Number.isInteger(v) && v > 0,
  },
  fullName: {
    type: "string",
    required: true,
    validate: (v) => v.trim().length >= 3,
  },
  nationalId: {
    type: "string",
    required: true,
    validate: (v) => /^[0-9]{14}$/.test(v),
  },
  jobTitle: {
    type: "string",
    required: true,
    validate: (v) => typeof v === "string",
  },
  phoneNumber: {
    type: "string",
    required: true,
    validate: (v) => /^[0-9]{10,15}$/.test(v),
  },
  email: {
    type: "string",
    required: false,
    validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  address: { type: "string", required: false },
  idCardImage: { type: "string", required: false },
};

export const updateEmployeeSchema = {
  fullName: { type: "string", required: false },
  nationalId: { type: "string", required: false },
  jobTitle: { type: "string", required: false },
  phoneNumber: { type: "string", required: false },
  email: { type: "string", required: false },
  address: { type: "string", required: false },
  idCardImage: { type: "string", required: false },
};
