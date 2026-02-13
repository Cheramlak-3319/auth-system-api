let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  const db = await mongoose.connect(process.env.MONGO_URI);

  isConnected = db.connections[0].readyState === 1;
  console.log("✅ MongoDB connected");
};

connectDB().catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});
