const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },

    // Module access control
    accessibleModules: [
      {
        type: String,
        enum: ["dube", "wfp"],
      },
    ],

    // User status
    isActive: {
      type: Boolean,
      default: true,
    },

    // For DUBE users
    countryCode: {
      type: String,
      uppercase: true,
      enum: ["ET", "KE", "SN", "UG", "TZ", "RW", "BI", null],
    },

    phoneNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{10,15}$/.test(v);
        },
        message: "Invalid phone number format",
      },
    },

    // Token management
    refreshToken: String,
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ accessibleModules: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can access a module
userSchema.methods.canAccessModule = function (moduleName) {
  if (this.role === ROLES.ADMIN) return true;
  return this.accessibleModules.includes(moduleName);
};

// Method to get safe user data (without sensitive info)
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
