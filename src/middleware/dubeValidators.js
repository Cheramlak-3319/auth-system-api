const { check } = require("express-validator");

// Project registration validation
const registerProjectValidation = [
  check("projectName")
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),

  check("countryCode")
    .notEmpty()
    .withMessage("Country code is required")
    .isLength({ min: 2, max: 2 })
    .withMessage("Country code must be 2 characters")
    .isUppercase()
    .withMessage("Country code must be uppercase"),

  check("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid mobile number format"),

  check("settlementAccount")
    .notEmpty()
    .withMessage("Settlement account is required")
    .isLength({ min: 5, max: 50 })
    .withMessage("Settlement account must be between 5 and 50 characters"),

  check("settlementBank")
    .notEmpty()
    .withMessage("Settlement bank is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Settlement bank must be between 2 and 50 characters"),
];

// Supplier registration validation
const registerSupplierValidation = [
  check("fullname")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  check("project").notEmpty().withMessage("Project is required"),

  check("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid mobile number format"),

  check("dialCode")
    .notEmpty()
    .withMessage("Dial code is required")
    .matches(/^\d{1,4}$/)
    .withMessage("Invalid dial code format"),
];

// Phone number change validation
const changePhoneValidation = [
  check("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .matches(/^\d{6}$/)
    .withMessage("User ID must be 6 digits"),

  check("toMobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid mobile number format"),

  check("dialCode")
    .notEmpty()
    .withMessage("Dial code is required")
    .matches(/^\d{1,4}$/)
    .withMessage("Invalid dial code format"),
];

// Name change validation
const changeNameValidation = [
  check("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .matches(/^\d{6}$/)
    .withMessage("User ID must be 6 digits"),

  check("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
];

// Customer self-registration validation
const customerSelfRegistrationValidation = [
  check("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10,15}$/)
    .withMessage("Invalid mobile number format"),

  check("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  check("dialCode")
    .notEmpty()
    .withMessage("Dial code is required")
    .matches(/^\d{1,4}$/)
    .withMessage("Invalid dial code format"),
];

module.exports = {
  registerProjectValidation,
  registerSupplierValidation,
  changePhoneValidation,
  changeNameValidation,
  customerSelfRegistrationValidation,
};
