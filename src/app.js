// ========================================
// FILE: src/app.js
// DESC: Main Express application configuration
// ========================================

// Load environment variables first
require("dotenv").config();

// Import required modules
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

// Create Express application
const app = express();

// ========================================
// MIDDLEWARE SETUP
// ========================================

// 1. Security headers
app.use(helmet());

// 2. Enable CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// 3. Request logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("📝 Morgan logging enabled for development");
}

// 4. Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// 5. Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Authentication System API is running!",
    version: "1.0.0",
    documentation: `${process.env.BASE_URL}/api-docs`,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `🔍 Route not found: ${req.originalUrl}`,
    suggestion: "Check the API documentation for available endpoints",
  });
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Export the app
module.exports = app;
