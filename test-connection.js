// test-db-connection.js
require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
  console.log("🔧 Testing MongoDB connection...\n");

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("❌ MONGODB_URI is not defined in .env file");
    process.exit(1);
  }

  console.log(`📡 Connecting to: ${mongoURI}\n`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Connected successfully!\n");
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🖥  Host: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(
      `📈 Ready State: ${conn.connection.readyState} (1 = Connected)`,
    );

    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\n📂 Collections (${collections.length}):`);
    collections.forEach((collection) => {
      console.log(`   - ${collection.name}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔒 Connection closed");
  } catch (error) {
    console.error(`\n❌ Connection failed: ${error.message}`);

    // More detailed error information
    if (error.name === "MongoServerSelectionError") {
      console.log("\n💡 Troubleshooting tips:");
      console.log("   1. Make sure MongoDB is running");
      console.log("   2. Check if the connection string is correct");
      console.log("   3. Verify network/firewall settings");
      console.log("   4. Try connecting with MongoDB Compass or mongo shell");
    }

    process.exit(1);
  }
};

// Run the test
testConnection();
