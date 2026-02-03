const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { check } = require("express-validator");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  [
    check("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    check("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),

    check("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
      .withMessage(
        "Password must contain at least one uppercase, one lowercase, one number and one special character",
      ),

    check("role")
      .optional()
      .isIn(["user", "dube_viewer", "wfp_viewer"])
      .withMessage("Invalid role for self-registration"),
  ],
  authController.register,
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    User login
 * @access  Public
 */
router.post(
  "/login",
  [
    check("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    check("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login,
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post(
  "/refresh-token",
  [check("refreshToken").notEmpty().withMessage("Refresh token is required")],
  authController.refreshToken,
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post(
  "/logout",
  [check("refreshToken").optional()],
  authController.logout,
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/me",
  authenticate,
  [
    check("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
  ],
  authController.updateProfile,
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  [
    check("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    check("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
      .withMessage(
        "New password must contain at least one uppercase, one lowercase, one number and one special character",
      ),
  ],
  authController.changePassword,
);

module.exports = router;
