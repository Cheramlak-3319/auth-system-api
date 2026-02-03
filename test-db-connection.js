require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/database.js");
const User = require("./src/models/user.js");

const testConnection = async () => {
  try {
    console.log(
      "\n============================================================",
    );
    console.log("🧪 TESTING DATABASE CONNECTION AND USER MODEL");
    console.log(
      "============================================================\n",
    );

    console.log("1. 🔗 Connecting to database...");
    await connectDB();

    console.log("\n2. 📊 Checking connection status...");
    console.log("   Ready State:", mongoose.connection.readyState);
    console.log("   Database Name:", mongoose.connection.name);
    console.log("   Host:", mongoose.connection.host);
    console.log("   Port:", mongoose.connection.port);

    console.log("\n3. 📂 Listing collections...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    collections.forEach((c) => console.log("   -", c.name));

    console.log("\n4. 👤 Testing User model - CREATE operation...");

    const testUser = await User.create({
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "password123",
    });

    console.log("   ✅ User created:", testUser._id);

    console.log("\n5. 🔍 Testing User model - READ operation...");

    const fetchedUser = await User.findById(testUser._id);

    if (!fetchedUser) {
      throw new Error("User not found after creation");
    }

    console.log("   ✅ User fetched successfully");
    console.log("   Name:", fetchedUser.name);
    console.log("   Email:", fetchedUser.email);
    console.log("   Created At:", fetchedUser.createdAt);

    console.log("\n6. 🧹 Cleaning up test data...");
    await User.deleteOne({ _id: testUser._id });
    console.log("   ✅ Test user removed");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Stack trace:", error);
    process.exit(1);
  }
};

testConnection();
