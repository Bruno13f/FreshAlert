import express from "express";
import { getDBClient, testConnection } from "../config/database.js";

const router = express.Router();

/**
 * Health check endpoint
 */
router.get("/", (req, res) => {
  res.json({
    message: "FreshAlert API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check for database
 */
router.get("/health", async (req, res) => {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /atividades - Fetch all activities
 */
router.get("/atividades", async (req, res) => {
  try {
    const client = getDBClient();
    const query = "SELECT * FROM atividades ORDER BY id ASC";
    const result = await client.query(query);

    console.log(`📋 Fetched ${result.rows.length} atividades`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching atividades:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch atividades",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
