// ==========================================
// maintenances.schema
// ==========================================

/**
 * Schema for creating a new maintenance record
 */
export const createMaintenanceSchema = {
  customerId: {
    type: "number",
    required: true,
    rules: "يجب أن يكون عدداً موجباً",
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        return "معرف العميل يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  serviceId: {
    type: "number",
    required: true,
    rules: "يجب أن يكون عدداً موجباً",
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        return "معرف الخدمة يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  productId: {
    type: "number",
    required: true,
    rules: "يجب أن يكون عدداً موجباً",
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        return "معرف المنتج يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  technicianId: {
    type: "number",
    required: true,
    rules: "يجب أن يكون عدداً موجباً",
    validate: (value) => {
      if (!Number.isInteger(value) || value <= 0) {
        return "معرف الفني يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  companyId: {
    type: "number",
    required: false,
    rules: "يجب أن يكون عدداً موجباً (يتم تعيينها تلقائياً للمديرين)",
    validate: (value) => {
      if (value && (!Number.isInteger(value) || value <= 0)) {
        return "معرف الشركة يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  maintenanceDate: {
    type: "string",
    required: true,
    rules: "يجب أن يكون تاريخاً صحيحاً بصيغة ISO",
    validate: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return "يجب إدخال تاريخ صحيح";
      }
      return null;
    },
  },
  price: {
    type: "number",
    required: true,
    rules: "يجب أن يكون عدداً موجباً أو صفر",
    validate: (value) => {
      if (typeof value !== "number" || value < 0) {
        return "السعر يجب أن يكون عدداً موجباً أو صفر";
      }
      return null;
    },
  },
  status: {
    type: "string",
    required: false,
    rules: "يجب أن يكون: Pending, Completed, Cancelled, Overdue",
    validate: (value) => {
      if (
        value &&
        !["Pending", "Completed", "Cancelled", "Overdue"].includes(value)
      ) {
        return "الحالة يجب أن تكون: Pending, Completed, Cancelled, أو Overdue";
      }
      return null;
    },
  },
  notes: {
    type: "string",
    required: false,
    rules: "حقل نصي اختياري",
    validate: (value) => {
      if (value && typeof value !== "string") {
        return "الملاحظات يجب أن تكون نصاً";
      }
      return null;
    },
  },
};

/**
 * Schema for updating maintenance record
 */
export const updateMaintenanceSchema = {
  customerId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value && (!Number.isInteger(value) || value <= 0)) {
        return "معرف العميل يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  serviceId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value && (!Number.isInteger(value) || value <= 0)) {
        return "معرف الخدمة يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  productId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value && (!Number.isInteger(value) || value <= 0)) {
        return "معرف المنتج يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  technicianId: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value && (!Number.isInteger(value) || value <= 0)) {
        return "معرف الفني يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
  maintenanceDate: {
    type: "string",
    required: false,
    validate: (value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return "يجب إدخال تاريخ صحيح";
        }
      }
      return null;
    },
  },
  price: {
    type: "number",
    required: false,
    validate: (value) => {
      if (value !== undefined && (typeof value !== "number" || value < 0)) {
        return "السعر يجب أن يكون عدداً موجباً أو صفر";
      }
      return null;
    },
  },
  status: {
    type: "string",
    required: false,
    validate: (value) => {
      if (
        value &&
        !["Pending", "Completed", "Cancelled", "Overdue"].includes(value)
      ) {
        return "الحالة يجب أن تكون: Pending, Completed, Cancelled, أو Overdue";
      }
      return null;
    },
  },
  notes: {
    type: "string",
    required: false,
  },
};

/**
 * Schema for bulk status update
 */
export const bulkUpdateStatusSchema = {
  maintenanceIds: {
    type: "array",
    required: true,
    rules: "يجب أن تكون مصفوفة من الأعداد الموجبة",
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return "معرفات الصيانات يجب أن تكون مصفوفة غير فارغة";
      }
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        return "جميع معرفات الصيانات يجب أن تكون أعداداً موجبة";
      }
      return null;
    },
  },
  status: {
    type: "string",
    required: true,
    rules: "يجب أن يكون: Pending, Completed, Cancelled, Overdue",
    validate: (value) => {
      if (!["Pending", "Completed", "Cancelled", "Overdue"].includes(value)) {
        return "الحالة يجب أن تكون: Pending, Completed, Cancelled, أو Overdue";
      }
      return null;
    },
  },
};

/**
 * Schema for customer status update (Active/Inactive)
 */
export const updateCustomerStatusSchema = {
  customerIds: {
    type: "array",
    required: true,
    rules: "يجب أن تكون مصفوفة من الأعداد الموجبة",
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return "معرفات العملاء يجب أن تكون مصفوفة غير فارغة";
      }
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        return "جميع معرفات العملاء يجب أن تكون أعداداً موجبة";
      }
      return null;
    },
  },
  status: {
    type: "string",
    required: true,
    rules: "يجب أن يكون 'Active' أو 'Inactive'",
    validate: (value) => {
      if (!["Active", "Inactive"].includes(value)) {
        return "الحالة يجب أن تكون Active أو Inactive";
      }
      return null;
    },
  },
  reason: {
    type: "string",
    required: false,
    rules: "مطلوب عند تحديد Inactive، الحد الأدنى 3 أحرف",
    validate: (value, allData) => {
      if (!allData || typeof allData !== "object") {
        return "خطأ في البيانات المرسلة";
      }

      const status = allData.status;
      if (!status) {
        return "الحالة مطلوبة";
      }

      if (status === "Inactive") {
        if (!value || typeof value !== "string" || value.trim().length < 3) {
          return "سبب التوقف مطلوب ويجب أن يكون 3 أحرف على الأقل عند تحديد Inactive";
        }
      }

      return null;
    },
  },
  notes: {
    type: "string",
    required: false,
  },
};

/**
 * Schema for customer reactivation
 */
export const reactivateCustomersSchema = {
  customerIds: {
    type: "array",
    required: true,
    rules: "يجب أن تكون مصفوفة من الأعداد الموجبة",
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return "معرفات العملاء يجب أن تكون مصفوفة غير فارغة";
      }
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        return "جميع معرفات العملاء يجب أن تكون أعداداً موجبة";
      }
      return null;
    },
  },
  notes: {
    type: "string",
    required: false,
  },
};

/**
 * Schema for maintenance ID param
 */
export const maintenanceIdSchema = {
  id: {
    type: "number",
    required: true,
    validate: (value) => {
      const numValue = Number(value);
      if (!Number.isInteger(numValue) || numValue <= 0) {
        return "المعرف يجب أن يكون عدداً موجباً";
      }
      return null;
    },
  },
};
