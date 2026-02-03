// ========================================
// FILE: src/models/WFPBeneficiary.js
// DESC: WFP Beneficiary model
// ========================================

const mongoose = require("mongoose");

const subWalletSchema = new mongoose.Schema(
  {
    walletName: {
      type: String,
      required: true,
      trim: true,
    },
    walletBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    cycle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    allocatedAmount: {
      type: Number,
      default: 0,
    },
    usedAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const wfpBeneficiarySchema = new mongoose.Schema({
  householdId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  beneficiaryName: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^251[0-9]{9}$/.test(v);
      },
      message: "Mobile must be Ethiopian format (251xxxxxxxxx)",
    },
  },
  mainWallet: {
    type: String,
    required: true,
    unique: true,
  },
  mainWalletBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  subWallets: [subWalletSchema],
  woreda: {
    type: String,
    trim: true,
  },
  kebele: {
    type: String,
    trim: true,
  },
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WFPCycle",
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending"],
    default: "active",
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  totalReceived: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
});

// Update lastUpdated on save
wfpBeneficiarySchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Calculate total balance from subwallets
wfpBeneficiarySchema.virtual("totalSubWalletBalance").get(function () {
  return this.subWallets.reduce(
    (total, wallet) => total + wallet.walletBalance,
    0,
  );
});

// Calculate total allocated amount
wfpBeneficiarySchema.virtual("totalAllocatedAmount").get(function () {
  return this.subWallets.reduce(
    (total, wallet) => total + wallet.allocatedAmount,
    0,
  );
});

// Indexes
wfpBeneficiarySchema.index({ householdId: 1, isActive: 1 });
wfpBeneficiarySchema.index({ mobile: 1 });
wfpBeneficiarySchema.index({ beneficiaryName: "text" });
wfpBeneficiarySchema.index({ cycleId: 1, status: 1 });

const WFPBeneficiary = mongoose.model("WFPBeneficiary", wfpBeneficiarySchema);

module.exports = WFPBeneficiary;
