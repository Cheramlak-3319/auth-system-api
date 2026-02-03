const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  earningWallet: { type: String },
  productId: { type: String },
  price: { type: Number },
  quantity: { type: Number },
  supplier_name: { type: String },
  supplier_id: { type: String },
  order_date: { type: Date },
  hellooMarketOrderId: { type: String },
});

const receiptSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    idList: { type: String },
    receiptFilename: { type: String, required: true },
    uploadedOn: { type: Date, default: Date.now },
    order: [orderItemSchema],
    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSED", "REJECTED", "PENDING"],
      default: "RECEIVED",
    },
    countryCode: { type: String },
    project: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes
receiptSchema.index({ id: 1 });
receiptSchema.index({ status: 1 });
receiptSchema.index({ uploadedOn: -1 });
receiptSchema.index({ countryCode: 1 });

module.exports = mongoose.model("DubeReceipt", receiptSchema);
