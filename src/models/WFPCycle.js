// ========================================
// FILE: src/models/WFPCycle.js
// DESC: WFP Cycle model for project cycles
// ========================================

const mongoose = require("mongoose");

const wfpCycleSchema = new mongoose.Schema({
  cycleName: {
    type: String,
    required: true,
    trim: true,
  },
  cycleCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["planned", "active", "completed", "cancelled"],
    default: "planned",
  },
  totalAllocatedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalDisbursedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalBeneficiaries: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
wfpCycleSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validate endDate > startDate
wfpCycleSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

// Virtual for cycle duration in days
wfpCycleSchema.virtual("durationInDays").get(function () {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes
wfpCycleSchema.index({ cycleCode: 1, isActive: 1 });
wfpCycleSchema.index({ startDate: 1, endDate: 1 });
wfpCycleSchema.index({ status: 1 });

const WFPCycle = mongoose.model("WFPCycle", wfpCycleSchema);

module.exports = WFPCycle;
