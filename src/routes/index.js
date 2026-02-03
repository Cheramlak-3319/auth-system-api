// ========================================
// FILE: src/routes/index.js
// DESC: Main routes file that combines all routes
// ========================================

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const wfpRoutes = require("./wfpRoutes");

// API Versioning
const API_VERSION = process.env.API_VERSION || "v1";
const API_PREFIX = `/api/${API_VERSION}`;

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Health check route (public)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require("../../package.json").version,
    modules: {
      authentication: true,
      wfp: true,
      database: true,
    },
  });
});

// Welcome route (public)
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Authentication & WFP System API",
    version: "1.0.0",
    description: "World Food Programme Management System with Authentication",
    documentation: `${req.protocol}://${req.get("host")}/api-docs`,
    publicEndpoints: [
      `POST ${API_PREFIX}/auth/register`,
      `POST ${API_PREFIX}/auth/login`,
      `POST ${API_PREFIX}/auth/refresh-token`,
      `POST ${API_PREFIX}/auth/forgot-password`,
      `GET /health`,
    ],
    note: "All other endpoints require authentication",
  });
});

// ========================================
// API ROUTES
// ========================================

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);

// WFP routes (protected)
router.use(`${API_PREFIX}/wfp`, wfpRoutes);

// ========================================
// 404 HANDLER (Catch-all for API and non-API routes)
// ========================================

router.use((req, res) => {
  const isApiRoute = req.originalUrl.startsWith("/api/");

  if (isApiRoute) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.originalUrl}`,
      suggestion: "Check the API documentation for available endpoints",
      documentation: `${req.protocol}://${req.get("host")}/api-docs`,
      availableModules: [
        {
          name: "Authentication",
          basePath: `${API_PREFIX}/auth`,
          description: "User authentication and profile management",
        },
        {
          name: "WFP",
          basePath: `${API_PREFIX}/wfp`,
          description: "World Food Programme management system",
          note: "Requires WFP role or admin access",
        },
      ],
    });
  }

  // Non-API routes
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableRoutes: [
      "/",
      "/health",
      "/api-docs",
      `${API_PREFIX}/auth/register`,
      `${API_PREFIX}/auth/login`,
    ],
  });
});

module.exports = router;
