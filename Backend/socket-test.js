import { io } from "socket.io-client";

console.log("🧪 Testing Socket.IO connection...\n");

const socket = io("http://localhost:3000");

// Connection events
socket.on("connect", () => {
  console.log("✅ Connected to server");
  console.log(`🆔 Socket ID: ${socket.id}\n`);

  // Start testing after connection
  runTests();
});

socket.on("connected", (data) => {
  console.log("📡 Welcome message:", data.message);
  console.log("🕐 Server time:", data.timestamp);
  console.log("");
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
  process.exit(1);
});

// Test responses
socket.on("joined:linha", (data) => {
  console.log(`✅ Joined room: ${data.room}`);
});

socket.on("pong", (data) => {
  console.log(`🏓 Pong received at: ${data.timestamp}`);
});

socket.on("error", (error) => {
  console.error("❌ Socket error:", error.message);
  if (error.errors) {
    console.error("   Details:", error.errors);
  }
});

// Test functions
async function runTests() {
  console.log("🧪 Starting Socket.IO tests...\n");

  // Test 1: Ping
  console.log("1️⃣ Testing ping...");
  socket.emit("ping");

  await wait(1000);

  // Test 2: Join room
  console.log("2️⃣ Testing room join...");
  socket.emit("join:linha", 1);

  await wait(1000);

  // Test 5: Leave room
  console.log("5️⃣ Testing room leave...");
  socket.emit("leave:linha", 1);

  await wait(1000);

  console.log("✅ All tests completed!");
  console.log("👋 Disconnecting...");

  socket.disconnect();
  process.exit(0);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Terminating test...");
  socket.disconnect();
  process.exit(0);
});
