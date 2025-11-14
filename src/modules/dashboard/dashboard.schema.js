// ==========================================
// dashboard.schema.js
// ==========================================

export const dateRangeSchema = {
  startDate: {
    type: "string",
    required: false,
    validate: (v) => !v || !isNaN(Date.parse(v)), // ISO date check
  },
  endDate: {
    type: "string",
    required: false,
    validate: (v, obj) =>
      !v ||
      (!isNaN(Date.parse(v)) &&
        (!obj.startDate || new Date(v) > new Date(obj.startDate))),
  },
};

export const paginationSchema = {
  page: {
    type: "number",
    required: false,
    default: 1,
    validate: (v) => Number.isInteger(v) && v >= 1,
  },
  limit: {
    type: "number",
    required: false,
    default: 10,
    validate: (v) => Number.isInteger(v) && v >= 1 && v <= 100,
  },
};

export const recentInvoicesQuerySchema = {
  limit: {
    type: "number",
    required: false,
    default: 5,
    validate: (v) => Number.isInteger(v) && v >= 1 && v <= 50,
  },
  saleType: {
    type: "string",
    required: false,
    validate: (v) => !v || ["Cash", "Installment"].includes(v),
  },
};

export const upcomingMaintenancesQuerySchema = {
  limit: {
    type: "number",
    required: false,
    default: 10,
    validate: (v) => Number.isInteger(v) && v >= 1 && v <= 50,
  },
  days: {
    type: "number",
    required: false,
    default: 30,
    validate: (v) => Number.isInteger(v) && v >= 1 && v <= 90,
  },
  status: {
    type: "string",
    required: false,
    validate: (v) =>
      !v || ["Pending", "Completed", "Cancelled", "Overdue"].includes(v),
  },
};
