// ==========================================
// aiQuery.schema.js (Validation Schema)
// ==========================================

export const querySchema = {
  query: {
    type: "string",
    required: true,
    validate: (value) => {
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("نص الاستعلام مطلوب");
      }
      if (value.length > 500) {
        throw new Error("نص الاستعلام طويل جدًا (الحد الأقصى 500 حرف)");
      }
      return true;
    },
  },
};
