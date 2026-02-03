/**
 * Role-Based Access Control Middleware
 * Checks if user has required role and module access
 */

/**
 * Authorize by role
 * @param {Array} allowedRoles - Roles that can access the route
 * @param {String} module - Module name (optional, for module isolation)
 */
const authorize = (allowedRoles = [], module = null) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;
      const userModules = req.user.modules || [];

      // Super admin can access everything
      if (userRole === "super_admin") {
        return next();
      }

      // Check module access (if module is specified)
      if (module && !userModules.includes(module)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have access to ${module.toUpperCase()} module.`,
        });
      }

      // Check role access
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      // Check admin access for the module
      if (module && userRole === "admin") {
        // Admin has access to everything
        return next();
      }

      // Role hierarchy check for module-specific admins
      const roleHierarchy = {
        super_admin: 100,
        admin: 90,
        dube_admin: 80,
        wfp_admin: 80,
        dube_viewer: 70,
        wfp_viewer: 70,
        dube_field_agent: 60,
        wfp_health_officer: 60,
        user: 0,
      };

      // Get the minimum required role level
      const allowedRoleLevels = allowedRoles.map(
        (role) => roleHierarchy[role] || 0,
      );
      const minRequiredLevel = Math.max(...allowedRoleLevels);

      if (roleHierarchy[userRole] < minRequiredLevel) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Higher privileges required.",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

/**
 * Check specific permission
 * @param {String} permission - Specific permission required
 */
const hasPermission = (permission) => {
  const permissionMap = {
    // DUBE permissions
    "dube.merchant.create": ["dube_admin", "admin", "super_admin"],
    "dube.merchant.view": ["dube_admin", "dube_viewer", "admin", "super_admin"],
    "dube.customer.create": [
      "dube_admin",
      "dube_field_agent",
      "admin",
      "super_admin",
    ],
    "dube.customer.view": [
      "dube_admin",
      "dube_viewer",
      "dube_field_agent",
      "admin",
      "super_admin",
    ],

    // WFP permissions
    "wfp.beneficiary.create": [
      "wfp_admin",
      "wfp_health_officer",
      "admin",
      "super_admin",
    ],
    "wfp.beneficiary.view": [
      "wfp_admin",
      "wfp_viewer",
      "wfp_health_officer",
      "admin",
      "super_admin",
    ],

    // System permissions
    "user.manage": ["admin", "super_admin"],
    "system.settings": ["super_admin"],
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;
      const allowedRoles = permissionMap[permission] || [];

      if (allowedRoles.length === 0) {
        console.warn(
          `Permission "${permission}" not defined in permission map`,
        );
        return next();
      }

      if (userRole === "super_admin" || allowedRoles.includes(userRole)) {
        return next();
      }

      res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${permission}`,
      });
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

module.exports = {
  authorize,
  hasPermission,
};
