// ==========================================
// dashboard.schema.js - VALIDATION SCHEMAS
// ==========================================

/**
 * Date Range Filter Schema
 */
export const dateRangeSchema = {
  type: "object",
  properties: {
    startDate: {
      type: "string",
      format: "date-time",
      description: "Start date for range filter (ISO 8601)",
    },
    endDate: {
      type: "string",
      format: "date-time",
      description: "End date for range filter (ISO 8601)",
    },
  },
};

/**
 * Pagination Schema
 */
export const paginationSchema = {
  type: "object",
  properties: {
    page: {
      type: "integer",
      minimum: 1,
      default: 1,
      description: "Page number for pagination",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 10,
      description: "Number of records per page (max 100)",
    },
  },
};

/**
 * Recent Invoices Query Schema
 */
export const recentInvoicesQuerySchema = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      default: 5,
      description: "Number of recent invoices to retrieve",
    },
    saleType: {
      type: "string",
      enum: ["Cash", "Installment"],
      description: "Filter by sale type",
    },
  },
};

/**
 * Upcoming Maintenances Query Schema
 */
export const upcomingMaintenancesQuerySchema = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      default: 10,
      description: "Number of upcoming maintenances to retrieve",
    },
    days: {
      type: "integer",
      minimum: 1,
      maximum: 90,
      default: 30,
      description: "Number of days ahead to check for maintenances",
    },
    status: {
      type: "string",
      enum: ["Pending", "Completed", "Cancelled", "Overdue"],
      description: "Filter by maintenance status",
    },
  },
};

/**
 * Period Filter Schema
 */
export const periodFilterSchema = {
  type: "object",
  properties: {
    period: {
      type: "string",
      enum: ["day", "week", "month", "year"],
      default: "month",
      description: "Time period for grouping data",
    },
  },
};

/**
 * Sales Overview Query Schema
 */
export const salesOverviewQuerySchema = {
  allOf: [dateRangeSchema, periodFilterSchema],
};

/**
 * Products Performance Query Schema
 */
export const productsPerformanceQuerySchema = {
  allOf: [
    dateRangeSchema,
    {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by product category",
        },
      },
    },
  ],
};

/**
 * Maintenance Tracking Query Schema
 */
export const maintenanceTrackingQuerySchema = {
  allOf: [dateRangeSchema],
};

/**
 * Installments Dashboard Query Schema
 */
export const installmentsQuerySchema = {
  allOf: [dateRangeSchema],
};

/**
 * Employees Performance Query Schema
 */
export const employeesPerformanceQuerySchema = {
  allOf: [dateRangeSchema],
};

/**
 * Dashboard Statistics Response Schema
 */
export const dashboardStatsResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        totalCustomers: { type: "integer" },
        pendingInstallments: { type: "integer" },
        upcomingMaintenances: { type: "integer" },
        lowStockItems: { type: "integer" },
        lowStockAccessories: { type: "integer" },
        monthlyRevenue: { type: "number" },
        overduePayments: { type: "integer" },
      },
    },
  },
};

/**
 * Recent Invoices Response Schema
 */
export const recentInvoicesResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          InvoiceID: { type: "integer" },
          customerId: { type: "integer" },
          CustomerID: { type: "integer" },
          totalAmount: { type: "number" },
          TotalAmount: { type: "number" },
          saleType: { type: "string" },
          SaleType: { type: "string" },
          contractDate: { type: "string", format: "date-time" },
          ContractDate: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

/**
 * Upcoming Maintenances Response Schema
 */
export const upcomingMaintenancesResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          MaintenanceID: { type: "integer" },
          customerId: { type: "integer" },
          CustomerID: { type: "integer" },
          maintenanceDate: { type: "string", format: "date-time" },
          MaintenanceDate: { type: "string", format: "date-time" },
          price: { type: "number" },
          Price: { type: "number" },
          status: { type: "string" },
          Status: { type: "string" },
          notes: { type: "string" },
          Notes: { type: "string" },
          customer: {
            type: "object",
            properties: {
              fullName: { type: "string" },
              FullName: { type: "string" },
              primaryNumber: { type: "string" },
              PrimaryNumber: { type: "string" },
            },
          },
          product: {
            type: "object",
            properties: {
              name: { type: "string" },
              Name: { type: "string" },
              productName: { type: "string" },
            },
          },
          service: {
            type: "object",
            properties: {
              name: { type: "string" },
              Name: { type: "string" },
            },
          },
        },
      },
    },
  },
};

/**
 * Generic Error Response Schema
 */
export const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", const: false },
    error: { type: "string" },
  },
};

/**
 * API Response Wrapper
 */
export const apiResponseSchema = (dataSchema) => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: dataSchema,
    error: { type: "string" },
  },
});
