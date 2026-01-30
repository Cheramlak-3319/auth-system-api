// ========================================
// FILE: src/server.js
// DESC: Server entry point and configuration
// ========================================

// Load environment variables
require("dotenv").config();

// Import the app
const app = require("./app");

// ========================================
// SERVER CONFIGURATION
// ========================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ========================================
// START SERVER
// ========================================

const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 AUTHENTICATION SYSTEM API");
  console.log("=".repeat(50));
  console.log(`✅ Server started successfully!`);
  console.log(`📡 Environment: ${NODE_ENV}`);
  console.log(`🌐 URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log(
    `📚 API Documentation: ${process.env.BASE_URL || `http://localhost:${PORT}`}/api-docs`,
  );
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log("=".repeat(50) + "\n");
});

// ========================================
// GRACEFUL SHUTDOWN HANDLERS
// ========================================

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("\n❌ UNHANDLED REJECTION! Shutting down...");
  console.error("Error:", err.name, err.message);

  // Close server gracefully
  server.close(() => {
    console.log("💥 Process terminated due to unhandled rejection");
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("\n❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Error:", err.name, err.message);

  // Exit process
  process.exit(1);
});

// Handle SIGTERM (Heroku, Docker, etc.)
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received. Shutting down gracefully...");

  server.close(() => {
    console.log("✅ Process terminated gracefully");
    process.exit(0);
  });
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received. Shutting down gracefully...");

  server.close(() => {
    console.log("✅ Process terminated gracefully");
    process.exit(0);
  });
});
