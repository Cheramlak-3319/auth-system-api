// ========================================
// FILE: src/middleware/wfpAuth.js
// DESC: WFP-specific authentication and authorization middleware
// ========================================

const User = require("../models/user");

/**
 * Check if user can access WFP module
 */
const canAccessWFP = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required to access WFP module",
      });
    }

    // Check if user has WFP role or is admin
    const canAccess = req.user.canAccessWFP && req.user.canAccessWFP();

    if (!canAccess) {
      return res.status(403).json({
        error: true,
        message: "You do not have permission to access WFP module",
      });
    }

    // Update last WFP login time
    req.user.lastWfpLogin = new Date();
    await req.user.save();

    next();
  } catch (error) {
    console.error("WFP access check error:", error);
    res.status(500).json({
      error: true,
      message: "Internal server error during authorization check",
    });
  }
};

/**
 * WFP Role-based access control
 * @param {...string} allowedRoles - Roles that can access the route
 */
const requireWfpRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;

      // Admin has full access
      if (userRole === "admin") {
        return next();
      }

      // Check if user has WFP role
      if (!userRole.startsWith("wfp_")) {
        return res.status(403).json({
          error: true,
          message: "WFP role required to access this resource",
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: true,
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("WFP role check error:", error);
      res.status(500).json({
        error: true,
        message: "Internal server error during role check",
      });
    }
  };
};

/**
 * Check WFP-specific permission
 * @param {string} permission - Permission to check (e.g., 'view_beneficiaries', 'create_transactions')
 */
const requireWfpPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      // Admin has all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user has the specific permission
      const hasPermission =
        req.user.hasWfpPermission && req.user.hasWfpPermission(permission);

      if (!hasPermission) {
        return res.status(403).json({
          error: true,
          message: `Permission denied: ${permission}`,
        });
      }

      next();
    } catch (error) {
      console.error("WFP permission check error:", error);
      res.status(500).json({
        error: true,
        message: "Internal server error during permission check",
      });
    }
  };
};

/**
 * Check if user can manage specific cycle
 * @param {string} cycleIdParam - Request parameter name containing cycle ID
 */
const canManageCycle = (cycleIdParam = "cycleId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      // Admin can manage all cycles
      if (req.user.role === "admin") {
        return next();
      }

      const cycleId =
        req.params[cycleIdParam] ||
        req.body[cycleIdParam] ||
        req.query[cycleIdParam];

      if (!cycleId) {
        return next(); // No cycle specified, proceed
      }

      // Check if user is assigned to this cycle
      const isAssigned =
        req.user.assignedCycles &&
        req.user.assignedCycles.some(
          (assignedCycle) => assignedCycle.toString() === cycleId.toString(),
        );

      // WFP admin can manage all cycles
      if (req.user.role === "wfp_admin" || isAssigned) {
        return next();
      }

      return res.status(403).json({
        error: true,
        message: "You are not authorized to manage this cycle",
      });
    } catch (error) {
      console.error("Cycle management check error:", error);
      res.status(500).json({
        error: true,
        message: "Internal server error during cycle check",
      });
    }
  };
};

/**
 * Check if user can view specific region data
 */
const canViewRegion = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Admin and WFP admin can view all regions
    if (req.user.role === "admin" || req.user.role === "wfp_admin") {
      return next();
    }

    // If user has assigned regions, they can only view data from those regions
    const requestedRegion = req.query.region || req.body.region;

    if (
      requestedRegion &&
      req.user.assignedRegions &&
      req.user.assignedRegions.length > 0
    ) {
      const canView = req.user.assignedRegions.some(
        (region) => region.toLowerCase() === requestedRegion.toLowerCase(),
      );

      if (!canView) {
        return res.status(403).json({
          error: true,
          message: "You are not authorized to view data from this region",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Region view check error:", error);
    res.status(500).json({
      error: true,
      message: "Internal server error during region check",
    });
  }
};

/**
 * Rate limiting for WFP endpoints (different from regular auth endpoints)
 */
const wfpRateLimit = {
  // Standard WFP endpoints (GET requests)
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: true,
      message: "Too many requests. Please try again after 15 minutes.",
    },
  },

  // Sensitive WFP endpoints (POST requests)
  sensitive: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window
    message: {
      error: true,
      message:
        "Too many modification requests. Please try again after 15 minutes.",
    },
  },

  // Report generation endpoints
  reports: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reports per hour
    message: {
      error: true,
      message: "Too many report requests. Please try again after 1 hour.",
    },
  },
};

module.exports = {
  canAccessWFP,
  requireWfpRole,
  requireWfpPermission,
  canManageCycle,
  canViewRegion,
  wfpRateLimit,
};
