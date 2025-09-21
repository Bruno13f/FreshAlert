import express from "express";
import {
  sendMessageToBedrock,
  sendConversationToBedrock,
  testBedrockConnection,
} from "../services/bedrock.js";
import {
  validateChatMessage,
  validateConversation,
} from "../utils/validation.js";
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  sendResponse,
} from "../utils/response.js";
import { getAllAtividades, getRecentAtividades } from "./atividades.js";

const router = express.Router();

/**
 * Helper function to format timestamp to readable format
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("pt-PT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

/**
 * POST /chat/message - Send a single message to Bedrock
 */
router.post("/message", async (req, res) => {
  try {
    // Validate request data
    const validationErrors = validateChatMessage(req.body);
    if (validationErrors.length > 0) {
      const response = validationErrorResponse(validationErrors);
      return sendResponse(res, response);
    }

    let { message, systemPrompt } = req.body;
    message +=
      ". Response de forma mais consisa possível, com apenas a resposta pretendida e uma pequena justificaçao apenas, em portugues de portugal.";

    // Grab recent activities from the DB to include in the prompt
    const activities = await getRecentAtividades(undefined, 20); // Get last 20 activities

    // Format activities for the AI context
    const activitiesContext =
      activities.length > 0
        ? `\n\nRecent activities context:\n${activities
            .map(
              (a) =>
                `- Activity ${a.id}: Linha ${a.linha_id}, Fresh: ${
                  a.is_fresh ? "Yes" : "No"
                }, Verified: ${formatTimestamp(a.verified_at)}`
            )
            .join("\n")}`
        : "\n\nNo recent activities available.";

    console.log(`🤖 Processing chat message: "${message.substring(0, 50)}..."`);
    console.log(
      `📋 Including ${activities.length} recent activities in context`
    );

    // Enhanced system prompt with activities context
    const enhancedSystemPrompt =
      (systemPrompt || process.env.SYSTEM_PROMPT) + activitiesContext;

    // Send message to Bedrock with enhanced context
    const result = await sendMessageToBedrock(message, enhancedSystemPrompt);

    const response = successResponse(result, "Message processed successfully");
    sendResponse(res, response);
  } catch (error) {
    console.error("❌ Error in chat message:", error);

    const response = errorResponse(
      error.error || "Chat service error",
      error.details || error.message,
      error.statusCode || 500
    );
    sendResponse(res, response);
  }
});

/**
 * POST /chat/conversation - Send a conversation to Bedrock
 */
router.post("/conversation", async (req, res) => {
  try {
    // Validate request data
    const validationErrors = validateConversation(req.body);
    if (validationErrors.length > 0) {
      const response = validationErrorResponse(validationErrors);
      return sendResponse(res, response);
    }

    const { messages, systemPrompt } = req.body;

    // Grab recent activities from the DB to include in the prompt
    const activities = await getRecentAtividades(undefined, 20); // Get last 20 activities

    // Format activities for the AI context
    const activitiesContext =
      activities.length > 0
        ? `\n\nRecent activities context:\n${activities
            .map(
              (a) =>
                `- Activity ${a.id}: Linha ${a.linha_id}, Fresh: ${
                  a.is_fresh ? "Yes" : "No"
                }, Verified: ${formatTimestamp(a.verified_at)}`
            )
            .join("\n")}`
        : "\n\nNo recent activities available.";

    console.log(`🤖 Processing conversation with ${messages.length} messages`);
    console.log(
      `📋 Including ${activities.length} recent activities in context`
    );

    // Enhanced system prompt with activities context
    const enhancedSystemPrompt =
      (systemPrompt || process.env.SYSTEM_PROMPT) + activitiesContext;

    // Send conversation to Bedrock with enhanced context
    const result = await sendConversationToBedrock(
      messages,
      enhancedSystemPrompt
    );

    const response = successResponse(
      result,
      "Conversation processed successfully"
    );
    sendResponse(res, response);
  } catch (error) {
    console.error("❌ Error in conversation:", error);

    const response = errorResponse(
      error.error || "Chat service error",
      error.details || error.message,
      error.statusCode || 500
    );
    sendResponse(res, response);
  }
});

/**
 * GET /chat/test - Test Bedrock connection
 */
router.get("/test", async (req, res) => {
  try {
    console.log("🧪 Testing Bedrock connection...");

    const result = await testBedrockConnection();

    if (result.connected) {
      const response = successResponse(result, "Bedrock connection successful");
      sendResponse(res, response);
    } else {
      const response = errorResponse(
        "Bedrock connection failed",
        result.error,
        503
      );
      sendResponse(res, response);
    }
  } catch (error) {
    console.error("❌ Error testing Bedrock:", error);

    const response = errorResponse(
      "Connection test failed",
      error.message,
      500
    );
    sendResponse(res, response);
  }
});

/**
 * GET /chat/status - Get chat service status and configuration
 */
router.get("/status", (req, res) => {
  const status = {
    service: "AWS Bedrock Chat",
    model: process.env.BEDROCK_MODEL_ID || "Not configured",
    region: process.env.AWS_REGION || "Not configured",
    maxTokens: process.env.BEDROCK_MAX_TOKENS || "256",
    systemPrompt: process.env.SYSTEM_PROMPT ? "Configured" : "Not configured",
    credentialsConfigured: !!(
      process.env.ACCESS_KEY && process.env.SECRET_ACCESS_KEY
    ),
  };

  const response = successResponse(status, "Chat service status");
  sendResponse(res, response);
});

/**
 * GET /chat/debug - Debug endpoint with detailed configuration
 */
router.get("/debug", (req, res) => {
  const debug = {
    environment: process.env.NODE_ENV || "development",
    model: {
      id: process.env.BEDROCK_MODEL_ID || "Not set",
      isClaude3: (process.env.BEDROCK_MODEL_ID || "").includes("claude-3"),
      maxTokens: process.env.BEDROCK_MAX_TOKENS || "256 (default)",
    },
    aws: {
      region: process.env.AWS_REGION || "Not set",
      accessKeyConfigured: !!process.env.ACCESS_KEY,
      secretKeyConfigured: !!process.env.SECRET_ACCESS_KEY,
      accessKeyPrefix: process.env.ACCESS_KEY
        ? process.env.ACCESS_KEY.substring(0, 4) + "..."
        : "Not set",
    },
    systemPrompt: {
      configured: !!process.env.SYSTEM_PROMPT,
      value:
        process.env.NODE_ENV === "development"
          ? process.env.SYSTEM_PROMPT
          : "Hidden in production",
    },
    timestamp: new Date().toISOString(),
  };

  const response = successResponse(debug, "Debug information");
  sendResponse(res, response);
});

export default router;
