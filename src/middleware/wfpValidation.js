// ========================================
// FILE: src/middleware/wfpValidation.js
// DESC: WFP-specific validation
// ========================================

const { body, query, param, validationResult } = require("express-validator");
const WFPCycle = require("../models/WFPCycle");
const WFPBeneficiary = require("../models/WFPBeneficiary");

// Custom validators
const customValidators = {
  // Validate Ethiopian mobile number
  isEthiopianMobile: (value) => {
    if (!value) return true;
    const mobile = value.replace("+", "");
    if (!/^251[0-9]{9}$/.test(mobile)) {
      throw new Error("Mobile must be Ethiopian format (251xxxxxxxxx)");
    }
    return true;
  },

  // Validate date range
  isValidDateRange: (startField, endField) => {
    return (value, { req }) => {
      const startDate = req.body[startField];
      const endDate = req.body[endField];

      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    };
  },

  // Validate cycle exists
  cycleExists: async (value) => {
    if (!value) return true;
    const cycle = await WFPCycle.findById(value);
    if (!cycle) {
      throw new Error("Cycle not found");
    }
    return true;
  },

  // Validate beneficiary exists
  beneficiaryExists: async (value) => {
    if (!value) return true;
    const beneficiary = await WFPBeneficiary.findOne({
      householdId: value.toUpperCase(),
    });
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    return true;
  },

  // Validate status
  isValidBeneficiaryStatus: (value) => {
    const validStatuses = ["active", "inactive", "suspended", "pending"];
    if (value && !validStatuses.includes(value.toLowerCase())) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }
    return true;
  },
};

// Validation chains
const wfpValidation = {
  // Register category validation
  registerCategory: [
    body("categoryName")
      .trim()
      .notEmpty()
      .withMessage("Category name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Category name must be between 2 and 50 characters"),

    body("subcategories")
      .isArray({ min: 1 })
      .withMessage("At least one subcategory is required")
      .custom((value) => {
        if (!Array.isArray(value)) return false;
        return value.every(
          (item) => typeof item === "string" && item.trim().length > 0,
        );
      })
      .withMessage("Subcategories must be an array of non-empty strings"),

    body("cycles").optional().isString().withMessage("Cycles must be a string"),
  ],

  // Register cycle validation
  registerCycle: [
    body("categoryName")
      .trim()
      .notEmpty()
      .withMessage("Cycle name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Cycle name must be between 2 and 100 characters"),

    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be a valid date (YYYY-MM-DD)"),

    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date (YYYY-MM-DD)")
      .custom(customValidators.isValidDateRange("startDate", "endDate")),
  ],

  // Update cycle validation
  updateCycle: [
    body("id")
      .notEmpty()
      .withMessage("Cycle ID is required")
      .isMongoId()
      .withMessage("Invalid cycle ID")
      .custom(customValidators.cycleExists),

    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date (YYYY-MM-DD)"),
  ],

  // Register health officer validation
  registerHealthOfficer: [
    body("hoName")
      .trim()
      .notEmpty()
      .withMessage("Health officer name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("hoMobile")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .custom(customValidators.isEthiopianMobile),
  ],

  // Change beneficiary status validation
  changeBeneficiaryStatus: [
    body("householdId")
      .trim()
      .notEmpty()
      .withMessage("Household ID is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Household ID must be between 5 and 20 characters")
      .custom(customValidators.beneficiaryExists),

    body("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .custom(customValidators.isValidBeneficiaryStatus),
  ],

  // Register onboarding agent validation
  registerOnboardingAgent: [
    body("agentName")
      .trim()
      .notEmpty()
      .withMessage("Agent name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("agentMobile")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .custom(customValidators.isEthiopianMobile),
  ],

  // Update onboarding agent validation
  updateOnboardingAgent: [
    body("mobile")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .custom(customValidators.isEthiopianMobile),

    body("active")
      .notEmpty()
      .withMessage("Active status is required")
      .isIn(["0", "1", "true", "false", true, false])
      .withMessage("Active must be 0, 1, true, or false"),
  ],

  // Update food category list validation
  updateFoodCategoryList: [
    body("mobile")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .custom(customValidators.isEthiopianMobile),

    body("categoryList")
      .isArray({ min: 1 })
      .withMessage("At least one category is required")
      .custom((value) => {
        if (!Array.isArray(value)) return false;
        return value.every(
          (item) => typeof item === "string" && item.trim().length > 0,
        );
      })
      .withMessage("Category list must be an array of non-empty strings"),
  ],

  // Cancel cycle validation
  cancelCycle: [
    body("cycleId")
      .notEmpty()
      .withMessage("Cycle ID is required")
      .isMongoId()
      .withMessage("Invalid cycle ID")
      .custom(customValidators.cycleExists),
  ],

  // Transfer credit validation
  transferCredit: [
    body("householdId")
      .trim()
      .notEmpty()
      .withMessage("Household ID is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Household ID must be between 5 and 20 characters")
      .custom(customValidators.beneficiaryExists),

    body("cycle")
      .notEmpty()
      .withMessage("Cycle is required")
      .isMongoId()
      .withMessage("Invalid cycle ID")
      .custom(customValidators.cycleExists),
  ],

  // Validate disbursement validation
  validateDisbursement: [
    body("householdId")
      .trim()
      .notEmpty()
      .withMessage("Household ID is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Household ID must be between 5 and 20 characters")
      .custom(customValidators.beneficiaryExists),

    body("cycle")
      .notEmpty()
      .withMessage("Cycle is required")
      .isMongoId()
      .withMessage("Invalid cycle ID")
      .custom(customValidators.cycleExists),
  ],

  // Query parameter validations
  queryParams: {
    dateRange: [
      query("dateFrom")
        .optional()
        .isISO8601()
        .withMessage("dateFrom must be a valid date (YYYY-MM-DD)"),

      query("dateTo")
        .optional()
        .isISO8601()
        .withMessage("dateTo must be a valid date (YYYY-MM-DD)"),
    ],

    pagination: [
      query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),

      query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),

      query("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Offset must be a non-negative integer")
        .toInt(),
    ],

    search: [
      query("search")
        .optional()
        .isString()
        .withMessage("Search must be a string")
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search cannot exceed 100 characters"),
    ],
  },
};

// Middleware to validate WFP requests
const validateWFPRequest = (validations) => {
  return async (req, res, next) => {
    // Run validations
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
    }));

    // Return error response in WFP format
    return res.status(400).json({
      error: true,
      message: formattedErrors
        .map((err) => `${err.field}: ${err.message}`)
        .join(", "),
    });
  };
};

module.exports = {
  customValidators,
  wfpValidation,
  validateWFPRequest,
};
