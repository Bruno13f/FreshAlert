import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

let client;

/**
 * Initialize database connection
 */
export async function connectDB() {
  try {
    client = new Client(dbConfig);
    await client.connect();
    console.log("✅ Connected to PostgreSQL database");
    return client;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }
}

/**
 * Get the database client instance
 */
export function getDBClient() {
  if (!client) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return client;
}

/**
 * Close database connection
 */
export async function closeDB() {
  if (client) {
    try {
      await client.end();
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error closing database connection:", error.message);
      throw error;
    }
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const dbClient = getDBClient();
    await dbClient.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    return false;
  }
}
