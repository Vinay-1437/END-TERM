import mongoose from "mongoose";

/**
 * Connects to the MongoDB database using the URI in environment variables.
 * Exits the process if the connection fails — no point running without a database.
 */
export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGODB_URI (or MONGO_URI) is not defined in environment variables");
    }
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error.message);
    process.exit(1);
  }
};
