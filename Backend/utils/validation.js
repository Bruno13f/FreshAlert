/**
 * Validation utilities for API endpoints
 */

/**
 * Validate if a value is a positive integer
 */
export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validate if a value is a boolean
 */
export function isBoolean(value) {
  return typeof value === "boolean";
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body, requiredFields) {
  const errors = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`${field} is required`);
    }
  }

  return errors;
}

/**
 * Validate atividade creation data
 */
export function validateAtividadeData(body) {
  const errors = [];
  const { linha_id, is_fresh } = body;

  // Validate required fields
  const requiredErrors = validateRequiredFields(body, ["linha_id"]);
  errors.push(...requiredErrors);

  // Validate linha_id format
  if (linha_id !== undefined && !isPositiveInteger(linha_id)) {
    errors.push("linha_id must be a positive integer");
  }

  // Validate is_fresh format
  if (is_fresh !== undefined && !isBoolean(is_fresh)) {
    errors.push("is_fresh must be a boolean");
  }

  return errors;
}
