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

/**
 * Validate chat message data
 */
export function validateChatMessage(body) {
  const errors = [];
  const { message, systemPrompt } = body;

  // Validate required fields
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("message is required and must be a non-empty string");
  }

  // Validate message length
  if (message && message.length > 4000) {
    errors.push("message must be less than 4000 characters");
  }

  // Validate system prompt if provided
  if (systemPrompt !== undefined) {
    if (typeof systemPrompt !== "string") {
      errors.push("systemPrompt must be a string");
    } else if (systemPrompt.length > 1000) {
      errors.push("systemPrompt must be less than 1000 characters");
    }
  }

  return errors;
}

/**
 * Validate conversation data
 */
export function validateConversation(body) {
  const errors = [];
  const { messages, systemPrompt } = body;

  // Validate messages array
  if (!messages || !Array.isArray(messages)) {
    errors.push("messages must be an array");
    return errors;
  }

  if (messages.length === 0) {
    errors.push("messages array cannot be empty");
    return errors;
  }

  if (messages.length > 20) {
    errors.push("conversation cannot exceed 20 messages");
  }

  // Validate each message
  messages.forEach((msg, index) => {
    if (!msg || typeof msg !== "object") {
      errors.push(`message at index ${index} must be an object`);
      return;
    }

    if (!msg.role || !["user", "assistant"].includes(msg.role)) {
      errors.push(
        `message at index ${index} must have role 'user' or 'assistant'`
      );
    }

    if (
      !msg.content ||
      typeof msg.content !== "string" ||
      msg.content.trim().length === 0
    ) {
      errors.push(`message at index ${index} must have non-empty content`);
    }

    if (msg.content && msg.content.length > 4000) {
      errors.push(
        `message at index ${index} content must be less than 4000 characters`
      );
    }
  });

  // Validate system prompt if provided
  if (systemPrompt !== undefined) {
    if (typeof systemPrompt !== "string") {
      errors.push("systemPrompt must be a string");
    } else if (systemPrompt.length > 1000) {
      errors.push("systemPrompt must be less than 1000 characters");
    }
  }

  return errors;
}
