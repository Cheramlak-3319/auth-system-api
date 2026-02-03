const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema({
  transactionId: { type: String },
  amount: { type: Number },
  repaymentDate: { type: Date },
  status: { type: String, enum: ["PROCESSED", "PENDING", "FAILED"] },
});

const invoiceSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    merchantName: { type: String, required: true },
    merchantUserId: { type: String, required: true },
    merchantMobile: { type: String, required: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    transactionDate: { type: Date, default: Date.now },
    transactionStatus: {
      type: String,
      enum: ["PROCESSED", "FAILED", "PENDING", "CANCELLED"],
      default: "PENDING",
    },
    dueDate: { type: Date },
    overdue: { type: Boolean, default: false },
    repayed: { type: Number, default: 0 },
    remainingAmount: { type: Number },
    repayment: [repaymentSchema],
    wallet: { type: String },
    countryCode: { type: String },
    project: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
invoiceSchema.index({ transactionId: 1 });
invoiceSchema.index({ merchantUserId: 1 });
invoiceSchema.index({ customerMobile: 1 });
invoiceSchema.index({ transactionDate: -1 });
invoiceSchema.index({ transactionStatus: 1 });
invoiceSchema.index({ overdue: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ wallet: 1 });
invoiceSchema.index({ countryCode: 1 });

// Pre-save hook to calculate remaining amount
invoiceSchema.pre("save", function (next) {
  if (this.repayment && this.repayment.length > 0) {
    const totalRepaid = this.repayment.reduce(
      (sum, rep) => sum + rep.amount,
      0,
    );
    this.repayed = totalRepaid;
    this.remainingAmount = this.amount - totalRepaid;

    // Check if invoice is fully paid
    if (this.remainingAmount <= 0) {
      this.transactionStatus = "PROCESSED";
    }
  } else {
    this.remainingAmount = this.amount;
  }

  // Check if invoice is overdue
  if (this.dueDate && new Date() > this.dueDate) {
    this.overdue = true;
  }

  next();
});

module.exports = mongoose.model("DubeInvoice", invoiceSchema);
