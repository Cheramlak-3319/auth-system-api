const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Token = require("../models/Token");
const { validationResult } = require("express-validator");

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      modules: user.modules,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || "15m" },
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" },
  );

  return { accessToken, refreshToken };
};

/**
 * Save refresh token to database
 */
const saveRefreshToken = async (userId, refreshToken, ipAddress, userAgent) => {
  await Token.create({
    userId,
    token: refreshToken,
    type: "refresh",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ipAddress,
    userAgent,
  });
};

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, password, role = "user" } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role,
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Save refresh token
      await saveRefreshToken(
        user._id,
        refreshToken,
        req.ip,
        req.headers["user-agent"],
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: user.profile,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * User login
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Save refresh token
      await saveRefreshToken(
        user._id,
        refreshToken,
        req.ip,
        req.headers["user-agent"],
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: user.profile,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Check if token exists in database
      const tokenDoc = await Token.findOne({
        token: refreshToken,
        type: "refresh",
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!tokenDoc) {
        return res.status(401).json({
          success: false,
          message: "Refresh token expired or invalid",
        });
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        generateTokens(user);

      // Mark old token as used
      tokenDoc.used = true;
      await tokenDoc.save();

      // Save new refresh token
      await saveRefreshToken(
        user._id,
        newRefreshToken,
        req.ip,
        req.headers["user-agent"],
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        message: "Token refresh failed",
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Invalidate refresh token
        await Token.findOneAndUpdate(
          { token: refreshToken, type: "refresh" },
          { used: true },
        );
      }

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.profile,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get profile",
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/me
   */
  async updateProfile(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update fields
      if (name) user.name = name;

      user.updatedBy = userId;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: user.profile,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Get user with password
      const user = await User.findById(userId).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      user.updatedBy = userId;
      await user.save();

      // Invalidate all refresh tokens
      await Token.updateMany(
        { userId, type: "refresh", used: false },
        { used: true },
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
      });
    }
  }
}

module.exports = new AuthController();
