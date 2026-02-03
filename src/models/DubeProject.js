const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["ET", "KE", "SN", "UG", "TZ", "RW", "BI"],
    },
    countryName: { type: String, required: true },
    creditDisbursementWallet: { type: String, required: true },
    earningWallet: { type: String, required: true },
    settlementBank: { type: String },
    settlementAccount: { type: String },
    mobile: { type: String },
    dialCode: { type: String },
    active: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// Indexes
projectSchema.index({ projectName: 1 });
projectSchema.index({ countryCode: 1 });
projectSchema.index({ active: 1 });

module.exports = mongoose.model("DubeProject", projectSchema);
