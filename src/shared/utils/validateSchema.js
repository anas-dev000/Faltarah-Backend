export const validateSchema = (data, schema) => {
  const errors = {};

  // Check each field in schema
  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    // Check required fields
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors[field] = `${field} is required`;
      return;
    }

    // Skip if optional and not provided
    if (!rules.required && (value === undefined || value === null)) {
      return;
    }

    // Run validation
    if (rules.validate) {
      try {
        rules.validate(value);
      } catch (error) {
        errors[field] = error.message;
      }
    }
  });

  const hasErrors = Object.keys(errors).length > 0;

  return {
    valid: !hasErrors,
    errors: hasErrors ? errors : null,
  };
};
