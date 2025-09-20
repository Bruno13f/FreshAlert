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

/**
 * POST /atividades - Create a new activity
 */
router.post("/atividades", async (req, res) => {
  try {
    const { linha_id, is_fresh } = req.body;

    // Validate required fields
    if (!linha_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required field",
        message: "linha_id is required",
        timestamp: new Date().toISOString(),
      });
    }

    // Validate linha_id is a number
    if (!Number.isInteger(linha_id) || linha_id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid field value",
        message: "linha_id must be a positive integer",
        timestamp: new Date().toISOString(),
      });
    }

    // Validate is_fresh if provided
    if (is_fresh !== undefined && typeof is_fresh !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "Invalid field value",
        message: "is_fresh must be a boolean",
        timestamp: new Date().toISOString(),
      });
    }

    const client = getDBClient();

    // Build the query dynamically based on provided fields
    const fields = ["linha_id"];
    const values = [linha_id];
    const placeholders = ["$1"];

    let paramIndex = 2;

    if (is_fresh !== undefined) {
      fields.push("is_fresh");
      values.push(is_fresh);
      placeholders.push(`$${paramIndex++}`);
    }

    // verified at is now
    const verified_at = new Date().toISOString();
    fields.push("verified_at");
    values.push(verified_at);
    placeholders.push(`$${paramIndex++}`);

    const query = `
      INSERT INTO atividades (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await client.query(query, values);
    const newAtividade = result.rows[0];

    console.log(`✅ Created new atividade with ID: ${newAtividade.id}`);

    res.status(201).json({
      success: true,
      data: newAtividade,
      message: "Atividade created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error creating atividade:", error.message);

    // Handle specific database errors
    if (error.code === "23503") {
      // Foreign key violation
      return res.status(400).json({
        success: false,
        error: "Invalid reference",
        message: "The specified linha_id does not exist",
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === "23502") {
      // Not null violation
      return res.status(400).json({
        success: false,
        error: "Missing required field",
        message: "Required field cannot be null",
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create atividade",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
