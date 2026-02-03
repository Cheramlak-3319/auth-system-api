// ========================================
// FILE: src/config/jwt.js
// DESC: JWT configuration and constants
// ========================================

require("dotenv").config();

const JWT_CONFIG = {
  // Secret keys (should be in .env, these are fallbacks)
  ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    "your-access-secret-key-change-this-in-production",
  REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    "your-refresh-secret-key-change-this-in-production",

  // Token expiration times
  ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m", // 15 minutes
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d", // 7 days
  RESET_EXPIRY: process.env.JWT_RESET_EXPIRY || "10m", // 10 minutes
  VERIFY_EXPIRY: process.env.JWT_VERIFY_EXPIRY || "24h", // 24 hours

  // Token types
  TOKEN_TYPES: {
    ACCESS: "access",
    REFRESH: "refresh",
    RESET: "reset",
    VERIFY: "verify",
  },

  // Cookie options
  COOKIE_OPTIONS: {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
    sameSite: "strict", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/", // Cookie is accessible from all routes
  },

  // Token in response options
  TOKEN_IN_RESPONSE: true, // Whether to send tokens in JSON response (alternative is cookies)

  // Rate limiting for token refresh
  REFRESH_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 refresh requests per window
  },

  // Blacklist settings
  BLACKLIST_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Validate configuration
const validateConfig = () => {
  const errors = [];

  if (
    !JWT_CONFIG.ACCESS_SECRET ||
    JWT_CONFIG.ACCESS_SECRET.includes("change-this")
  ) {
    errors.push("JWT_ACCESS_SECRET is not set or is using default value");
  }

  if (
    !JWT_CONFIG.REFRESH_SECRET ||
    JWT_CONFIG.REFRESH_SECRET.includes("change-this")
  ) {
    errors.push("JWT_REFRESH_SECRET is not set or is using default value");
  }

  if (JWT_CONFIG.ACCESS_SECRET === JWT_CONFIG.REFRESH_SECRET) {
    console.warn(
      "⚠️ WARNING: Access and refresh tokens are using the same secret",
    );
  }

  if (errors.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(`JWT Configuration errors: ${errors.join(", ")}`);
  }

  return errors;
};

// Run validation
const configErrors = validateConfig();
if (configErrors.length > 0) {
  console.warn("⚠️ JWT Configuration warnings:", configErrors);
}

module.exports = JWT_CONFIG;
