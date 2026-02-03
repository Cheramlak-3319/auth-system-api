const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

/**
 * WFP Module Routes
 * All routes require WFP module access
 */

// ============================
// Category Management
// ============================

// Get categories - WFP viewers and admins can access
router.get(
  "/getcategories.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Categories endpoint",
      user: req.user,
      note: "WFP users cannot access DUBE routes",
    });
  },
);

// Register new category - WFP admin only
router.post(
  "/registercategory.php",
  authenticate,
  authorize(["wfp_admin"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Register category endpoint (admin only)",
      user: req.user,
    });
  },
);

// ============================
// Beneficiary Management
// ============================

// Get beneficiary list - WFP viewers and admins can access
router.get(
  "/getbeneficiarylist.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer", "wfp_health_officer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Beneficiary list endpoint",
      user: req.user,
    });
  },
);

// Register beneficiary - WFP admin and health officers can access
router.post(
  "/registerbeneficiary.php",
  authenticate,
  authorize(["wfp_admin", "wfp_health_officer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Register beneficiary endpoint",
      user: req.user,
    });
  },
);

// ============================
// Voucher Management
// ============================

// Get voucher list - WFP viewers and admins can access
router.get(
  "/getvoucherslist.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Voucher list endpoint",
      user: req.user,
    });
  },
);

// Register voucher - WFP admin only
router.post(
  "/registervoucher.php",
  authenticate,
  authorize(["wfp_admin"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Register voucher endpoint (admin only)",
      user: req.user,
    });
  },
);

// ============================
// Cycle Management
// ============================

// Get all cycles - WFP viewers and admins can access
router.get(
  "/getallcycles.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP All cycles endpoint",
      user: req.user,
    });
  },
);

// Register new cycle - WFP admin only
router.post(
  "/registerCycle",
  authenticate,
  authorize(["wfp_admin"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Register cycle endpoint (admin only)",
      user: req.user,
    });
  },
);

// ============================
// Personnel Management
// ============================

// Get onboarding agent list - WFP viewers and admins can access
router.get(
  "/getonboardingagentlist.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Onboarding agent list endpoint",
      user: req.user,
    });
  },
);

// Get health officer list - WFP viewers and admins can access
router.get(
  "/gethealthofficerlist.php",
  authenticate,
  authorize(["wfp_admin", "wfp_viewer", "wfp_health_officer"], "wfp"),
  (req, res) => {
    res.json({
      success: true,
      message: "WFP Health officer list endpoint",
      user: req.user,
    });
  },
);

module.exports = router;
