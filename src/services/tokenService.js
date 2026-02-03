// ========================================
// FILE: src/services/tokenService.js
// DESC: Service for JWT token generation, verification, and management
// ========================================

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const JWT_CONFIG = require("../config/jwt");
const Token = require("../models/Token");

class TokenService {
  constructor() {
    this.secret = JWT_CONFIG.SECRET;
    this.algorithm = JWT_CONFIG.ALGORITHM;
    this.issuer = JWT_CONFIG.ISSUER;
    this.audience = JWT_CONFIG.AUDIENCE;
  }

  // ========================================
  // TOKEN GENERATION
  // ========================================

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @param {string} payload.userId - User ID
   * @param {string} payload.role - User role
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    const options = {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: this.algorithm,
    };

    return jwt.sign(
      {
        sub: payload.userId,
        role: payload.role,
        type: JWT_CONFIG.TOKEN_TYPES.ACCESS,
        iat: Math.floor(Date.now() / 1000),
      },
      this.secret,
      options,
    );
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    const options = {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: this.algorithm,
    };

    return jwt.sign(
      {
        sub: payload.userId,
        role: payload.role,
        type: JWT_CONFIG.TOKEN_TYPES.REFRESH,
        iat: Math.floor(Date.now() / 1000),
      },
      this.secret,
      options,
    );
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} Tokens object with accessToken and refreshToken
   */
  generateAuthTokens(user) {
    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Generate password reset token
   * @returns {string} Random token string
   */
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate email verification token
   * @returns {string} Random token string
   */
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // ========================================
  // TOKEN VERIFICATION
  // ========================================

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @param {string} type - Expected token type
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  verifyToken(token, type = JWT_CONFIG.TOKEN_TYPES.ACCESS) {
    try {
      const options = {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: [this.algorithm],
      };

      const decoded = jwt.verify(token, this.secret, options);

      // Verify token type matches expected type
      if (decoded.type !== type) {
        console.warn(
          `Token type mismatch. Expected: ${type}, Got: ${decoded.type}`,
        );
        return null;
      }

      return decoded;
    } catch (error) {
      // Log specific error types for debugging
      switch (error.name) {
        case "TokenExpiredError":
          console.log("Token has expired");
          break;
        case "JsonWebTokenError":
          console.log("Invalid token");
          break;
        case "NotBeforeError":
          console.log("Token not active yet");
          break;
        default:
          console.log("Token verification failed:", error.message);
      }
      return null;
    }
  }

  // ========================================
  // TOKEN STORAGE & MANAGEMENT
  // ========================================

  /**
   * Store refresh token in database
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @param {Object} deviceInfo - Device information
   * @param {string} ipAddress - User IP address
   * @returns {Promise<Token>} Created token document
   */
  async storeRefreshToken(userId, refreshToken, deviceInfo = {}, ipAddress) {
    try {
      // Calculate expiration date from token
      const decoded = jwt.decode(refreshToken);
      const expiresAt = new Date(decoded.exp * 1000);

      const tokenDoc = await Token.create({
        user: userId,
        token: refreshToken,
        type: JWT_CONFIG.TOKEN_TYPES.REFRESH,
        expiresAt,
        device: deviceInfo,
        createdByIp: ipAddress,
      });

      return tokenDoc;
    } catch (error) {
      console.error("Error storing refresh token:", error);
      throw new Error("Failed to store refresh token");
    }
  }

  /**
   * Verify and get refresh token
   * @param {string} refreshToken - Refresh token to verify
   * @returns {Promise<Object|null>} Token document with populated user or null
   */
  async verifyRefreshToken(refreshToken) {
    try {
      // First verify JWT signature
      const decoded = this.verifyToken(
        refreshToken,
        JWT_CONFIG.TOKEN_TYPES.REFRESH,
      );
      if (!decoded) {
        return null;
      }

      // Look up token in database
      const tokenDoc = await Token.findActiveRefreshToken(
        decoded.sub,
        refreshToken,
      );
      if (!tokenDoc) {
        return null;
      }

      // Check if user is still active
      if (!tokenDoc.user || !tokenDoc.user.isActive) {
        await Token.blacklistToken(tokenDoc._id, "system", "user_inactive");
        return null;
      }

      return tokenDoc;
    } catch (error) {
      console.error("Error verifying refresh token:", error);
      return null;
    }
  }

  /**
   * Revoke refresh token
   * @param {string} refreshToken - Refresh token to revoke
   * @param {string} ipAddress - IP address of requester
   * @param {string} reason - Reason for revocation
   * @returns {Promise<boolean>} Success status
   */
  async revokeRefreshToken(refreshToken, ipAddress, reason = "logout") {
    try {
      // Hash the token to find it in database
      const hashedToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const tokenDoc = await Token.findOneAndUpdate(
        {
          token: hashedToken,
          type: JWT_CONFIG.TOKEN_TYPES.REFRESH,
          blacklisted: false,
        },
        {
          blacklisted: true,
          revokedAt: new Date(),
          revokedByIp: ipAddress,
          revokedReason: reason,
        },
        { new: true },
      );

      return !!tokenDoc;
    } catch (error) {
      console.error("Error revoking refresh token:", error);
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for user
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} Update result
   */
  async revokeAllUserTokens(userId, ipAddress, reason = "logout_all") {
    try {
      const result = await Token.blacklistUserTokens(userId, ipAddress, reason);
      return result;
    } catch (error) {
      console.error("Error revoking all user tokens:", error);
      throw new Error("Failed to revoke all tokens");
    }
  }

  // ========================================
  // TOKEN UTILITIES
  // ========================================

  /**
   * Get device information from request
   * @param {Object} req - Express request object
   * @returns {Object} Device information
   */
  getDeviceInfo(req) {
    const userAgent = req.get("User-Agent") || "";
    const ip = req.ip || req.connection.remoteAddress;

    // Parse user agent (basic parsing)
    let deviceType = "desktop";
    let os = "Unknown OS";
    let browser = "Unknown Browser";

    if (userAgent.includes("Mobile")) {
      deviceType = "mobile";
    } else if (userAgent.includes("Tablet")) {
      deviceType = "tablet";
    }

    // OS detection
    if (userAgent.includes("Windows")) {
      os = "Windows";
    } else if (userAgent.includes("Mac OS")) {
      os = "Mac OS";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    } else if (userAgent.includes("Android")) {
      os = "Android";
    } else if (userAgent.includes("iOS")) {
      os = "iOS";
    }

    // Browser detection
    if (userAgent.includes("Chrome")) {
      browser = "Chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = "Safari";
    } else if (userAgent.includes("Edge")) {
      browser = "Edge";
    }

    return {
      userAgent,
      ipAddress: ip,
      deviceType,
      os,
      browser,
    };
  }

  /**
   * Get remaining token lifetime
   * @param {string} token - JWT token
   * @returns {number|null} Remaining seconds or null if invalid
   */
  getTokenLifetime(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - now);
    } catch (error) {
      return null;
    }
  }

  /**
   * Format token lifetime for display
   * @param {string} token - JWT token
   * @returns {string} Formatted lifetime
   */
  formatTokenLifetime(token) {
    const seconds = this.getTokenLifetime(token);
    if (seconds === null) return "Invalid token";

    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)} hours`;
    } else {
      return `${Math.floor(seconds / 86400)} days`;
    }
  }

  // ========================================
  // TOKEN CLEANUP
  // ========================================

  /**
   * Clean up expired tokens
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupTokens() {
    try {
      const result = await Token.cleanupExpiredTokens();
      return result;
    } catch (error) {
      console.error("Error cleaning up tokens:", error);
      throw new Error("Failed to clean up tokens");
    }
  }

  /**
   * Get token statistics
   * @returns {Promise<Array>} Token statistics
   */
  async getTokenStatistics() {
    try {
      const stats = await Token.getTokenStats();
      return stats;
    } catch (error) {
      console.error("Error getting token statistics:", error);
      throw new Error("Failed to get token statistics");
    }
  }
}

// Create and export singleton instance
module.exports = new TokenService();
