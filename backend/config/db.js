import mongoose from "mongoose";

/**
 * Connects to the MongoDB database using the URI in environment variables.
 * Exits the process if the connection fails — no point running without a database.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error.message);
    process.exit(1);
  }
};
