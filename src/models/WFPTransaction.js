// ========================================
// FILE: src/models/WFPTransaction.js
// DESC: WFP Transaction model for invoices, credits, cashouts
// ========================================

const mongoose = require("mongoose");

const transactionItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const wfpTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  transactionType: {
    type: String,
    enum: ["invoice", "credit", "cashout", "transfer"],
    required: true,
    index: true,
  },
  // For invoices
  merchantUserId: {
    type: String,
    index: true,
  },
  merchantName: {
    type: String,
    trim: true,
  },
  merchantMobile: {
    type: String,
  },
  // For beneficiaries
  householdId: {
    type: String,
    index: true,
  },
  customerName: {
    type: String,
    trim: true,
  },
  customerMobile: {
    type: String,
  },
  // Amount details
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  fee: {
    type: Number,
    default: 0,
    min: 0,
  },
  netAmount: {
    type: Number,
    min: 0,
  },
  // Transaction details
  transactionDate: {
    type: Date,
    required: true,
    index: true,
  },
  transactionStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "reversed"],
    default: "pending",
    index: true,
  },
  statusMessage: {
    type: String,
    trim: true,
  },
  // For invoices
  items: [transactionItemSchema],
  // For credits/transfers
  walletId: {
    type: String,
    index: true,
  },
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WFPCycle",
    index: true,
  },
  // For cashouts
  bank: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  requestDate: {
    type: Date,
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  remarks: {
    type: String,
    trim: true,
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
wfpTransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Calculate net amount
  if (this.transactionType === "cashout") {
    this.netAmount = this.amount - this.fee;
  } else {
    this.netAmount = this.amount;
  }

  next();
});

// Pre-save hook to calculate total amount from items
wfpTransactionSchema.pre("save", function (next) {
  if (
    this.transactionType === "invoice" &&
    this.items &&
    this.items.length > 0
  ) {
    this.amount = this.items.reduce(
      (total, item) => total + item.totalAmount,
      0,
    );
  }
  next();
});

// Indexes for faster queries
wfpTransactionSchema.index({ transactionDate: -1, transactionType: 1 });
wfpTransactionSchema.index({ householdId: 1, transactionType: 1 });
wfpTransactionSchema.index({ merchantUserId: 1, transactionStatus: 1 });
wfpTransactionSchema.index({ cycleId: 1, transactionStatus: 1 });

const WFPTransaction = mongoose.model("WFPTransaction", wfpTransactionSchema);

module.exports = WFPTransaction;
