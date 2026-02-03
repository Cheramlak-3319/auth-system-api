const mongoose = require("mongoose");

const merchantWalletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wallettype: {
    type: String,
    required: true,
    enum: ["MERCHANT_AVAILABLE", "MERCHANT_CREDIT", "MERCHANT_EARNING"],
  },
  balance: { type: Number, default: 0 },
  bnpl: { type: Number, default: 0 },
});

const merchantSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: "User ID must be 6 digits",
      },
    },
    fullname: { type: String, required: true },
    businessName: { type: String },
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
    dialCode: { type: String, required: true }, // +251, +254, etc
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["ET", "KE", "SN", "UG", "TZ", "RW", "BI"],
    },
    createdon: { type: Date, default: Date.now },
    project: { type: String, default: "Palladium" },
    initialdeposit: { type: Number, default: 0 },
    bnpl: { type: Number, default: 0 },
    active: { type: String, enum: ["0", "1"], default: "1" },
    lastTrxnDate: { type: Date },
    language: { type: String, default: "en" },
    wallets: [merchantWalletSchema],
    foodCategory: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// Indexes
merchantSchema.index({ userid: 1 });
merchantSchema.index({ mobile: 1 });
merchantSchema.index({ countryCode: 1 });
merchantSchema.index({ active: 1 });
merchantSchema.index({ project: 1 });
merchantSchema.index({ createdon: -1 });

module.exports = mongoose.model("DubeMerchant", merchantSchema);
