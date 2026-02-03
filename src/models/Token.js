const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    token: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["refresh", "reset_password", "verify_email"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "7d" }, // Auto-delete after 7 days
    },

    used: {
      type: Boolean,
      default: false,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ token: 1 }, { unique: true });
tokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Token", tokenSchema);
