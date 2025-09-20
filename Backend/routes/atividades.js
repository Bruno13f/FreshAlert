import express from "express";
import { getDBClient } from "../config/database.js";
import { validateAtividadeData } from "../utils/validation.js";
import {
  successResponse,
  validationErrorResponse,
  handleDatabaseError,
  sendResponse,
} from "../utils/response.js";

const router = express.Router();

/**
 * GET /atividades - Fetch all activities (with optional linha_id filter)
 */
router.get("/", async (req, res) => {
  try {
    const { linha_id } = req.query;
    const client = getDBClient();

    let query = "SELECT * FROM atividades";
    let values = [];

    // Add filter by linha_id if provided
    if (linha_id !== undefined && linha_id !== "") {
      // Validate linha_id parameter
      const linhaIdInt = parseInt(linha_id);
      if (isNaN(linhaIdInt) || linhaIdInt <= 0) {
        const response = validationErrorResponse(
          "linha_id must be a positive integer"
        );
        return sendResponse(res, response);
      }

      query += " WHERE linha_id = $1";
      values.push(linhaIdInt);
    }

    query += " ORDER BY id ASC";

    const result = await client.query(query, values);

    const filterText = linha_id ? ` for linha_id ${linha_id}` : "";
    console.log(`📋 Fetched ${result.rows.length} atividades${filterText}`);

    const response = successResponse(result.rows);
    sendResponse(res, response);
  } catch (error) {
    console.error("❌ Error fetching atividades:", error.message);
    const response = handleDatabaseError(error);
    sendResponse(res, response);
  }
});

/**
 * POST /atividades - Create a new activity
 */
router.post("/", async (req, res) => {
  try {
    // Validate request data
    const validationErrors = validateAtividadeData(req.body);
    if (validationErrors.length > 0) {
      const response = validationErrorResponse(validationErrors);
      return sendResponse(res, response);
    }

    const { linha_id, is_fresh } = req.body;
    const client = getDBClient();

    // Build query dynamically
    const fields = ["linha_id", "verified_at"];
    const values = [linha_id, new Date().toISOString()];
    const placeholders = ["$1", "$2"];

    if (is_fresh !== undefined) {
      fields.push("is_fresh");
      values.push(is_fresh);
      placeholders.push("$3");
    }

    const query = `
      INSERT INTO atividades (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await client.query(query, values);
    const newAtividade = result.rows[0];

    console.log(`✅ Created new atividade with ID: ${newAtividade.id}`);

    const response = successResponse(
      newAtividade,
      "Atividade created successfully",
      201
    );
    sendResponse(res, response);
  } catch (error) {
    const response = handleDatabaseError(error);
    sendResponse(res, response);
  }
});

/**
 * GET /atividades/:id - Get a specific activity
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      const response = validationErrorResponse("ID must be a positive integer");
      return sendResponse(res, response);
    }

    const client = getDBClient();
    const query = "SELECT * FROM atividades WHERE id = $1";
    const result = await client.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      const response = successResponse(null, "Atividade not found", 404);
      return sendResponse(res, response);
    }

    console.log(`📋 Fetched atividade with ID: ${id}`);

    const response = successResponse(result.rows[0]);
    sendResponse(res, response);
  } catch (error) {
    const response = handleDatabaseError(error);
    sendResponse(res, response);
  }
});

export default router;
