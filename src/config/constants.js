module.exports = {
  // User roles
  ROLES: {
    ADMIN: "admin",
    DUBE_ADMIN: "dube_admin",
    DUBE_VIEWER: "dube_viewer",
    WFP_ADMIN: "wfp_admin",
    WFP_VIEWER: "wfp_viewer",
    USER: "user",
  },

  // Permission scopes
  SCOPES: {
    DUBE: "dube",
    WFP: "wfp",
  },

  // Route permissions mapping
  ROUTE_PERMISSIONS: {
    // DUBE routes
    "/dube/international/getmerchantlist.php": {
      scope: "dube",
      roles: ["dube_admin", "dube_viewer", "admin"],
    },
    "/dube/international/getcustomerlist.php": {
      scope: "dube",
      roles: ["dube_admin", "dube_viewer", "admin"],
    },
    "/dube/international/getallinvoices.php": {
      scope: "dube",
      roles: ["dube_admin", "dube_viewer", "admin"],
    },

    // WFP routes (you'll add these later)
    "/wfp/getcategories.php": {
      scope: "wfp",
      roles: ["wfp_admin", "wfp_viewer", "admin"],
    },
    "/wfp/registercategory.php": {
      scope: "wfp",
      roles: ["wfp_admin", "admin"],
    },

    // Auth routes (public)
    "/auth/register": { scope: "public", roles: [] },
    "/auth/login": { scope: "public", roles: [] },
    "/auth/refresh-tokens": { scope: "public", roles: [] },
  },

  // Country codes
  COUNTRIES: {
    ET: "Ethiopia",
    KE: "Kenya",
    SN: "Senegal",
    UG: "Uganda",
    TZ: "Tanzania",
    RW: "Rwanda",
    BI: "Burundi",
  },
};
