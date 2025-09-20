import { closeDB } from "../config/database.js";

let httpServer = null;
let socketIO = null;

/**
 * Set server instances for graceful shutdown
 */
export function setServerInstances(server, io) {
  httpServer = server;
  socketIO = io;
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  try {
    // Close Socket.IO server first
    if (socketIO) {
      console.log("🔌 Closing Socket.IO server...");
      socketIO.close();
      console.log("✅ Socket.IO server closed");
    }

    // Close HTTP server
    if (httpServer) {
      console.log("🌐 Closing HTTP server...");
      httpServer.close((err) => {
        if (err) {
          console.error("❌ Error closing HTTP server:", err);
        } else {
          console.log("✅ HTTP server closed");
        }
      });
    }

    // Close database connection
    await closeDB();
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown() {
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });
}
