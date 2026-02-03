const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

// Import DUBE controllers (you'll create these later)
// const dubeController = require('../controllers/dubeController');

/**
 * DUBE International Module Routes
 * All routes require DUBE module access
 */

// ============================
// Merchant Management
// ============================

// Get merchant list - DUBE viewers and admins can access
router.get(
  "/international/getmerchantlist.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    // Placeholder - replace with actual controller
    res.json({
      success: true,
      message: "DUBE Merchant list endpoint",
      user: req.user,
    });
  },
);

// Get customer list - DUBE viewers and admins can access
router.get(
  "/international/getcustomerlist.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Customer list endpoint",
      user: req.user,
    });
  },
);

// Get all invoices - DUBE viewers and admins can access
router.get(
  "/international/getallinvoices.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE All invoices endpoint",
      user: req.user,
    });
  },
);

// ============================
// Project Management (Admin only)
// ============================

// Register new project - DUBE admin only
router.post(
  "/international/registerproject.php",
  authenticate,
  authorize(["dube_admin"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Register project endpoint (admin only)",
      user: req.user,
    });
  },
);

// Get project list - DUBE viewers and admins can access
router.get(
  "/international/getprojectlist.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Project list endpoint",
      user: req.user,
    });
  },
);

// ============================
// Supplier Management
// ============================

// Get supplier list - DUBE viewers and admins can access
router.get(
  "/international/getsupplierlist.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Supplier list endpoint",
      user: req.user,
    });
  },
);

// Register new supplier - DUBE admin only
router.post(
  "/international/registersupplier.php",
  authenticate,
  authorize(["dube_admin"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Register supplier endpoint (admin only)",
      user: req.user,
    });
  },
);

// ============================
// Field Agent Operations
// ============================

// Customer self-registration - Field agents can access
router.post(
  "/international/customerselfregistration.php",
  authenticate,
  authorize(["dube_admin", "dube_field_agent"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Customer self-registration endpoint",
      user: req.user,
    });
  },
);

// ============================
// Dashboard & Reports
// ============================

// Get totals dashboard - DUBE viewers and admins can access
router.get(
  "/international/gettotals.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Dashboard totals endpoint",
      user: req.user,
    });
  },
);

// Get top-up history - DUBE viewers and admins can access
router.get(
  "/gettopuphistory.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Top-up history endpoint",
      user: req.user,
    });
  },
);

// ============================
// User Management within DUBE
// ============================

// Change phone number - DUBE admin only
router.post(
  "/international/changephonenumber.php",
  authenticate,
  authorize(["dube_admin"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Change phone number endpoint (admin only)",
      user: req.user,
    });
  },
);

// Change user name - DUBE admin only
router.post(
  "/changename.php",
  authenticate,
  authorize(["dube_admin"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Change name endpoint (admin only)",
      user: req.user,
    });
  },
);

// ============================
// Receipt Management
// ============================

// Get receipt list - DUBE viewers and admins can access
router.get(
  "/international/getreceiptlist.php",
  authenticate,
  authorize(["dube_admin", "dube_viewer"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Receipt list endpoint",
      user: req.user,
    });
  },
);

// Update receipt status - DUBE admin only
router.post(
  "/international/updatereceiptstatus.php",
  authenticate,
  authorize(["dube_admin"], "dube"),
  (req, res) => {
    res.json({
      success: true,
      message: "DUBE Update receipt status endpoint (admin only)",
      user: req.user,
    });
  },
);

module.exports = router;
