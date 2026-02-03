// ========================================
// FILE: src/controllers/authController.js
// DESC: Authentication controller
// ========================================

const User = require("./src/models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper: Generate Access & Refresh Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );

  return { accessToken, refreshToken };
};

// ========================================
// REGISTER NEW USER
// ========================================
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1️⃣ Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // 2️⃣ Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
    });

    // 3️⃣ Generate tokens
    const tokens = generateTokens(newUser);

    // 4️⃣ Respond with user and tokens
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: newUser.toJSON(), // remove sensitive fields via schema transform
        tokens,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((field) => ({
        field,
        message: error.errors[field].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value entered",
        duplicateKey: error.keyValue,
      });
    }

    // Fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ========================================
// LOGIN
// ========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Generate tokens
    const tokens = generateTokens(user);

    // 4️⃣ Respond with user and tokens
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ========================================
// EXPORT OTHER CONTROLLERS (PLACEHOLDER)
// ========================================
exports.forgotPassword = async (req, res) => {
  res.status(200).json({ success: true, message: "Forgot password endpoint" });
};

exports.resetPassword = async (req, res) => {
  res.status(200).json({ success: true, message: "Reset password endpoint" });
};

exports.refreshToken = async (req, res) => {
  res.status(200).json({ success: true, message: "Refresh token endpoint" });
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: "Logout successful" });
};

exports.logoutAll = async (req, res) => {
  res.status(200).json({ success: true, message: "Logout all devices" });
};

exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

exports.updateProfile = async (req, res) => {
  res.status(200).json({ success: true, message: "Update profile endpoint" });
};

exports.changePassword = async (req, res) => {
  res.status(200).json({ success: true, message: "Change password endpoint" });
};
