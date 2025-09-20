import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Import modules
import { connectDB } from "./config/database.js";
import {
  setupMiddleware,
  setup404Handler,
  setupErrorHandler,
} from "./middleware/index.js";
import {
  setupGracefulShutdown,
  setServerInstances,
} from "./utils/gracefulShutdown.js";
import routes from "./routes/index.js";
import { setupSocketHandlers } from "./socket/index.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: false, // Set to false when using origin: "*"
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

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
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "*");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Setup Socket.IO handlers
    setupSocketHandlers(io);

    app.use("/", routes);

    // Setup error handling
    setup404Handler(app);
    setupErrorHandler(app);

    // Setup graceful shutdown
    setServerInstances(server, io);
    setupGracefulShutdown();

    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Express server running at http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO server running on the same port`);
      console.log(`📚 API endpoints:`);
      console.log(`   GET  /           - Health check`);
      console.log(`   GET  /health     - Database health check`);
      console.log(`   GET  /atividades - Fetch all activities`);
      console.log(`   POST /atividades - Create new activity`);
      console.log(`   GET  /atividades/:id - Get specific activity`);
      console.log(`🤖 Chat endpoints:`);
      console.log(`   GET  /chat/status      - Chat service status`);
      console.log(`   GET  /chat/debug       - Debug configuration`);
      console.log(`   GET  /chat/test        - Test Bedrock connection`);
      console.log(`   POST /chat/message     - Send single message`);
      console.log(`   POST /chat/conversation - Send conversation`);
      console.log(`🔌 Socket events:`);
      console.log(`   connection           - Client connected`);
      console.log(`   join:linha          - Join linha room`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Make io available globally for other modules
export { io };

// Start the application
startServer();
