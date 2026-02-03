// ========================================
// FILE: src/models/WFPAgent.js
// DESC: WFP Agent models (Onboarding Agents & Health Officers)
// ========================================

const mongoose = require("mongoose");

const wfpAgentSchema = new mongoose.Schema({
  // Common fields
  agentType: {
    type: String,
    enum: ["onboarding", "health_officer", "field_officer"],
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^251[0-9]{9}$/.test(v);
      },
      message: "Mobile must be Ethiopian format (251xxxxxxxxx)",
    },
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  // Location info
  region: {
    type: String,
    trim: true,
  },
  zone: {
    type: String,
    trim: true,
  },
  woreda: {
    type: String,
    trim: true,
  },
  kebele: {
    type: String,
    trim: true,
  },
  // Status and activity
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending"],
    default: "active",
  },
  // Performance metrics
  totalBeneficiariesRegistered: {
    type: Number,
    default: 0,
  },
  totalTransactionsProcessed: {
    type: Number,
    default: 0,
  },
  lastActivityDate: {
    type: Date,
  },
  // For Health Officers
  qualification: {
    type: String,
    trim: true,
  },
  licenseNumber: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  // For Onboarding Agents
  assignedCategories: [
    {
      type: String,
      trim: true,
    },
  ],
  maxBeneficiariesPerDay: {
    type: Number,
    default: 50,
  },
  // Metadata
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Update updatedAt on save
wfpAgentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
wfpAgentSchema.index({ agentType: 1, isActive: 1 });
wfpAgentSchema.index({ mobile: 1, agentType: 1 });
wfpAgentSchema.index({ region: 1, zone: 1, woreda: 1 });

const WFPAgent = mongoose.model("WFPAgent", wfpAgentSchema);

module.exports = WFPAgent;
