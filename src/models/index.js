// ========================================
// FILE: src/models/index.js
// DESC: Export all models from a single file
// ========================================

const User = require("./user");
const Token = require("./Token");
const WFPCategory = require("./WFPCategory");
const WFPCycle = require("./WFPCycle");
const WFPBeneficiary = require("./WFPBeneficiary");
const WFPTransaction = require("./WFPTransaction");
const WFPAgent = require("./WFPAgent");

// Export all models
module.exports = {
  User,
  Token,
  WFPCategory,
  WFPCycle,
  WFPBeneficiary,
  WFPTransaction,
  WFPAgent,
};
