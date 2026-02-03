const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    wallet: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    pendingWalletBalance: { type: Number, default: 0 },
    mobile: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{10,15}$/.test(v);
        },
        message: "Invalid mobile number format",
      },
    },
    dialCode: { type: String, required: true },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["ET", "KE", "SN", "UG", "TZ", "RW", "BI"],
    },
    userId: { type: String },
    status: { type: String, enum: ["0", "1"], default: "1" },
    project: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// Indexes
supplierSchema.index({ wallet: 1 });
supplierSchema.index({ mobile: 1 });
supplierSchema.index({ countryCode: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ project: 1 });

module.exports = mongoose.model("DubeSupplier", supplierSchema);
