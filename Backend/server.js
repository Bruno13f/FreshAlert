import express from "express";
import dotenv from "dotenv";

// Import modules
import { connectDB } from "./config/database.js";
import {
  setupMiddleware,
  setup404Handler,
  setupErrorHandler,
} from "./middleware/index.js";
import { setupGracefulShutdown } from "./utils/gracefulShutdown.js";
import routes from "./routes/index.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize database connection
    await connectDB();

    // Setup middleware
    setupMiddleware(app);

    // Setup routes
    app.use("/", routes);

    // Setup error handling
    setup404Handler(app);
    setupErrorHandler(app);

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Express server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the application
startServer();
