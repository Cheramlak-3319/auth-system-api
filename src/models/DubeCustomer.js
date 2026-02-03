const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
  giftWallet: { type: String },
  giftedBy: { type: String },
  giftBalance: { type: Number, default: 0 },
  label: { type: String },
  theme: { type: String },
  sponsorName: { type: String },
  sponsorPhone: { type: String },
});

const creditLineSchema = new mongoose.Schema({
  type: { type: String },
  amount: { type: Number },
  limit: { type: Number },
  available: { type: Number },
});

const customerSchema = new mongoose.Schema(
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
    creditwallet: { type: String },
    purchasewallet: { type: String },
    purchasebalance: { type: Number, default: 0 },
    creditbalance: { type: Number, default: 0 },
    createdon: { type: Date, default: Date.now },
    createdby: { type: String },
    merchantName: { type: String },
    merchantUserId: { type: String },
    active: { type: String, enum: ["0", "1"], default: "1" },
    bnpl: { type: Number, default: 0 },
    otherCreditLines: [creditLineSchema],
    gifts: [giftSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// Indexes
customerSchema.index({ userid: 1 });
customerSchema.index({ mobile: 1 });
customerSchema.index({ countryCode: 1 });
customerSchema.index({ merchantUserId: 1 });
customerSchema.index({ active: 1 });
customerSchema.index({ createdon: -1 });

module.exports = mongoose.model("DubeCustomer", customerSchema);
