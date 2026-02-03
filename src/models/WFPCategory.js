// ========================================
// FILE: src/models/WFPCategory.js
// DESC: WFP Category and Subcategory model
// ========================================

const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const wfpCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  subcategories: [subcategorySchema],
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WFPCycle",
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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
wfpCategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
wfpCategorySchema.index({ category: 1, isActive: 1 });
wfpCategorySchema.index({ "subcategories.name": 1 });

const WFPCategory = mongoose.model("WFPCategory", wfpCategorySchema);

module.exports = WFPCategory;
