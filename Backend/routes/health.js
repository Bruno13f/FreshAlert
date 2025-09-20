import express from "express";
import { testConnection } from "../config/database.js";
import { successResponse, sendResponse } from "../utils/response.js";

const router = express.Router();

/**
 * GET / - Basic health check
 */
router.get("/", (req, res) => {
  const response = successResponse({
    message: "FreshAlert API is running",
    status: "healthy",
  });
  sendResponse(res, response);
});

/**
 * GET /health - Database health check
 */
router.get("/health", async (req, res) => {
  try {
    const isConnected = await testConnection();

    const statusCode = isConnected ? 200 : 503;
    const status = isConnected ? "healthy" : "unhealthy";
    const database = isConnected ? "connected" : "disconnected";

    const response = successResponse(
      {
        status,
        database,
      },
      null,
      statusCode
    );

    sendResponse(res, response);
  } catch (error) {
    const response = successResponse(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
      },
      null,
      503
    );

    sendResponse(res, response);
  }
});

export default router;
