import express from "express";
import { getDBClient } from "../config/database.js";
import { validateAtividadeData } from "../utils/validation.js";
import {
  successResponse,
  validationErrorResponse,
  handleDatabaseError,
  sendResponse,
} from "../utils/response.js";
import { io } from "../server.js"; // Import io for socket emissions

const router = express.Router();

/**
 * Helper function to get all activities (can be used by other modules)
 * @param {number|undefined} linha_id - Optional linha_id filter
 * @returns {Promise<Array>} Array of atividades
 */
export async function getAllAtividades(linha_id = undefined) {
  try {
    const client = getDBClient();

    let query = "SELECT * FROM atividades";
    let values = [];

    // Add filter by linha_id if provided
    if (linha_id !== undefined && linha_id !== null && linha_id !== "") {
      // Validate linha_id parameter
      const linhaIdInt = parseInt(linha_id);
      if (isNaN(linhaIdInt) || linhaIdInt <= 0) {
        throw new Error("linha_id must be a positive integer");
      }

      query += " WHERE linha_id = $1";
      values.push(linhaIdInt);
    }

    query += " ORDER BY id DESC"; // Most recent first

    const result = await client.query(query, values);

    const filterText = linha_id ? ` for linha_id ${linha_id}` : "";
    console.log(`📋 Retrieved ${result.rows.length} atividades${filterText}`);

    return result.rows;
  } catch (error) {
    console.error("❌ Error getting atividades:", error.message);
    throw error;
  }
}

/**
 * Helper function to get recent activities (last 10)
 * @param {number|undefined} linha_id - Optional linha_id filter
 * @returns {Promise<Array>} Array of recent atividades
 */
export async function getRecentAtividades(linha_id = undefined, limit = 10) {
  try {
    const client = getDBClient();

    let query = "SELECT * FROM atividades";
    let values = [];

    // Add filter by linha_id if provided
    if (linha_id !== undefined && linha_id !== null && linha_id !== "") {
      const linhaIdInt = parseInt(linha_id);
      if (isNaN(linhaIdInt) || linhaIdInt <= 0) {
        throw new Error("linha_id must be a positive integer");
      }

      query += " WHERE linha_id = $1";
      values.push(linhaIdInt);
    }

    query += " ORDER BY id DESC LIMIT $" + (values.length + 1);
    values.push(limit);

    const result = await client.query(query, values);

    console.log(`📋 Retrieved ${result.rows.length} recent atividades`);

    return result.rows;
  } catch (error) {
    console.error("❌ Error getting recent atividades:", error.message);
    throw error;
  }
}

/**
 * GET /atividades - Fetch all activities (with optional linha_id filter)
 */
router.get("/", async (req, res) => {
  try {
    const { linha_id } = req.query;

    const atividades = await getAllAtividades(linha_id);

    const response = successResponse(atividades);
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

    // Emit socket events for real-time updates
    if (io) {
      // Emit to specific linha room
      const room = `linha_${linha_id}`;
      io.to(room).emit("atividade:created", newAtividade);

      // Emit to all clients
      io.emit("atividade:new", newAtividade);

      console.log(
        `📡 Socket events emitted for new atividade: ${newAtividade.id}`
      );
    }

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
