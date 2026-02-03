const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const dubeRoutes = require("./routes/dubeRoutes");
const wfpRoutes = require("./routes/wfpRoutes");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ========================
// Database Connection
// ========================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// ========================
// Middleware
// ========================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========================
// Health Check
// ========================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "🚀 HellOOpass API Server",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
    modules: {
      auth: "/api/v1/auth",
      dube: "/api/v1/dube",
      wfp: "/api/v1/wfp",
    },
  });
});

// ========================
// API Routes
// ========================

// Public routes
app.use("/api/v1/auth", authRoutes);

// Protected DUBE routes (only if module is enabled)
if (process.env.ENABLE_DUBE_MODULE === "true") {
  app.use("/api/v1/dube", dubeRoutes);
  console.log("✅ DUBE module enabled");
}

// Protected WFP routes (only if module is enabled)
if (process.env.ENABLE_WFP_MODULE === "true") {
  app.use("/api/v1/wfp", wfpRoutes);
  console.log("✅ WFP module enabled");
}

// ========================
// Error Handling
// ========================

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// ========================
// Server Start
// ========================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(
    `🔗 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`,
  );
  console.log(
    `🔐 Auth API: ${process.env.BASE_URL || `http://localhost:${PORT}`}/api/v1/auth`,
  );

  if (process.env.ENABLE_DUBE_MODULE === "true") {
    console.log(
      `🌍 DUBE API: ${process.env.BASE_URL || `http://localhost:${PORT}`}/api/v1/dube`,
    );
  }

  if (process.env.ENABLE_WFP_MODULE === "true") {
    console.log(
      `🌾 WFP API: ${process.env.BASE_URL || `http://localhost:${PORT}`}/api/v1/wfp`,
    );
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});

module.exports = app;
