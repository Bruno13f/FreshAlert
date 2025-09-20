import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to the Socket.IO server
   */
  connect(url = "http://localhost:3001") {
    try {
      console.log(`🔌 Connecting to Socket.IO server: ${url}`);

      this.socket = io(url, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        forceNew: true,
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      console.error("❌ Error connecting to socket:", error);
      throw error;
    }
  }

  /**
   * Setup basic event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server");
      console.log(`🆔 Socket ID: ${this.socket.id}`);
      this.connected = true;
    });

    this.socket.on("connected", (data) => {
      console.log("📡 Welcome message:", data.message);
      console.log("🕐 Server time:", data.timestamp);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason);
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      this.connected = false;
    });

    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    // Handle room events
    this.socket.on("joined:linha", (data) => {
      console.log(`✅ Joined room: ${data.room}`);
    });

    this.socket.on("left:linha", (data) => {
      console.log(`👋 Left room: ${data.room}`);
    });

    // Handle pong responses
    this.socket.on("pong", (data) => {
      console.log(`🏓 Pong received at: ${data.timestamp}`);
    });
  }

  /**
   * Join a linha room
   */
  joinLinha(linhaId) {
    if (this.socket && this.connected) {
      console.log(`📡 Joining linha room: ${linhaId}`);
      this.socket.emit("join:linha", linhaId);
    } else {
      console.warn("❌ Socket not connected");
    }
  }

  /**
   * Leave a linha room
   */
  leaveLinha(linhaId) {
    if (this.socket && this.connected) {
      console.log(`📡 Leaving linha room: ${linhaId}`);
      this.socket.emit("leave:linha", linhaId);
    }
  }

  /**
   * Send ping to test connection
   */
  ping() {
    if (this.socket && this.connected) {
      console.log("🏓 Sending ping...");
      this.socket.emit("ping");
    }
  }

  /**
   * Listen for atividade events
   */
  onAtividadeEvents(callback) {
    if (!this.socket) return;

    this.socket.on("atividade:new", (atividade) => {
      console.log("🆕 New atividade:", atividade);
      callback("new", atividade);
    });

    this.socket.on("atividade:created", (atividade) => {
      console.log("✅ Atividade created in your linha:", atividade);
      callback("created", atividade);
    });
  }

  /**
   * Add custom event listener
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  /**
   * Emit custom event
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log("👋 Disconnecting from Socket.IO server");
      this.socket.disconnect();
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
