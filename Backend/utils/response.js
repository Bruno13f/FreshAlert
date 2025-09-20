/**
 * Response utilities for consistent API responses
 */

/**
 * Create a standardized success response
 */
export function successResponse(data, message = null, statusCode = 200) {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;

    // Add count for arrays
    if (Array.isArray(data)) {
      response.count = data.length;
    }
  }

  if (message) {
    response.message = message;
  }

  return { statusCode, response };
}

/**
 * Create a standardized error response
 */
export function errorResponse(error, message, statusCode = 500) {
  return {
    statusCode,
    response: {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors) {
  return errorResponse(
    "Validation failed",
    Array.isArray(errors) ? errors.join(", ") : errors,
    400
  );
}

/**
 * Handle database errors and return appropriate response
 */
export function handleDatabaseError(error) {
  console.error("❌ Database error:", error.message);

  // Foreign key violation
  if (error.code === "23503") {
    return errorResponse(
      "Invalid reference",
      "The specified reference does not exist",
      400
    );
  }

  // Not null violation
  if (error.code === "23502") {
    return errorResponse(
      "Missing required field",
      "Required field cannot be null",
      400
    );
  }

  // Unique violation
  if (error.code === "23505") {
    return errorResponse(
      "Duplicate entry",
      "Record with this value already exists",
      409
    );
  }

  // Default error
  return errorResponse(
    "Database error",
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error",
    500
  );
}

/**
 * Send response helper
 */
export function sendResponse(res, { statusCode, response }) {
  res.status(statusCode).json(response);
}
