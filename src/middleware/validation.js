// ========================================
// FILE: src/middleware/validation.js
// DESC: Validation middleware for request validation
// ========================================

const { body, param, query, validationResult } = require("express-validator");
const User = require("../models/user");

/**
 * Validate request and return errors if any
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    // Send error response
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  };
};

/**
 * Custom validators
 */
const customValidators = {
  // Check if email is unique
  isEmailUnique: async (value) => {
    const user = await User.findOne({ email: value.toLowerCase() });
    if (user) {
      throw new Error("Email already exists");
    }
    return true;
  },

  // Check if email exists
  isEmailExists: async (value) => {
    const user = await User.findOne({ email: value.toLowerCase() });
    if (!user) {
      throw new Error("Email not found");
    }
    return true;
  },

  // Check password strength
  isStrongPassword: (value) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!strongPasswordRegex.test(value)) {
      throw new Error(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
    }
    return true;
  },

  // Check phone number format
  isValidPhone: (value) => {
    if (!value) return true; // Phone is optional

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
      throw new Error("Please provide a valid phone number");
    }
    return true;
  },

  // Check if two fields match
  fieldsMatch: (field1, field2) => {
    return (value, { req }) => {
      if (value !== req.body[field2]) {
        throw new Error(`${field1} does not match ${field2}`);
      }
      return true;
    };
  },
};

/**
 * Validation chains for different endpoints
 */
const authValidation = {
  // Registration validation
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        "Name can only contain letters, spaces, apostrophes, periods, and hyphens",
      ),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .custom(customValidators.isEmailUnique),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .custom(customValidators.isStrongPassword),

    body("phone").optional().trim().custom(customValidators.isValidPhone),

    body("role")
      .optional()
      .isIn(["user", "admin", "moderator"])
      .withMessage("Role must be either: user, admin, or moderator"),
  ],

  // Login validation
  login: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  // Forgot password validation
  forgotPassword: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ],

  // Reset password validation
  resetPassword: [
    param("token").notEmpty().withMessage("Reset token is required"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .custom(customValidators.isStrongPassword),
  ],

  // Change password validation
  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .custom(customValidators.isStrongPassword)
      .custom(customValidators.fieldsMatch("newPassword", "confirmPassword")),

    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password"),
  ],

  // Refresh token validation
  refreshToken: [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  ],

  // Logout validation
  logout: [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  ],
};

// Export everything
module.exports = {
  validate,
  customValidators,
  authValidation,
};
