import { getDBClient } from "../config/database.js";
import { validateAtividadeData } from "../utils/validation.js";

/**
 * Setup Socket.IO event handlers
 */
export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room based on linha_id for targeted updates
    socket.on("join:linha", (linhaId) => {
      if (!linhaId || isNaN(parseInt(linhaId))) {
        socket.emit("error", { message: "Invalid linha_id provided" });
        return;
      }

      const room = `linha_${linhaId}`;
      socket.join(room);
      console.log(`📡 Client ${socket.id} joined room: ${room}`);
      socket.emit("joined:linha", { linhaId, room });
    });

    // Leave linha room
    socket.on("leave:linha", (linhaId) => {
      const room = `linha_${linhaId}`;
      socket.leave(room);
      console.log(`📡 Client ${socket.id} left room: ${room}`);
      socket.emit("left:linha", { linhaId, room });
    });

    // Ping/Pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`❌ Socket error from ${socket.id}:`, error);
    });

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to FreshAlert Socket.IO server",
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  console.log("🔌 Socket.IO handlers setup complete");
}
