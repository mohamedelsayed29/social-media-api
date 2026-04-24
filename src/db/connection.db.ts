import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000;

const connectDB = async (retries = MAX_RETRIES): Promise<void> => {
  const uri = process.env.DB_URI;

  if (!uri) {
    console.error("DB_URI is not defined in environment variables.");
    process.exit(1); // Hard fail — no point running without a DB URI
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,        // Max concurrent connections
      minPoolSize: 2,         // Keep at least 2 alive
    });

    console.log("✅ Database connected successfully");
    registerConnectionEvents();

  } catch (error) {
    console.error(`DB connection failed. Retries left: ${retries - 1}`, error);

    if (retries <= 1) {
      console.error("Max retries reached. Shutting down.");
      process.exit(1); // Crash intentionally so a process manager (PM2/k8s) can restart
    }

    await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
    return connectDB(retries - 1);
  }
};

const registerConnectionEvents = (): void => {
  const db = mongoose.connection;

  db.on("disconnected", () =>
    console.warn("MongoDB disconnected. Attempting to reconnect...")
  );

  db.on("reconnected", () =>
    console.log("✅ MongoDB reconnected successfully.")
  );

  db.on("error", (err) =>
    console.error("MongoDB runtime error:", err)
  );

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await db.close();
    console.log("MongoDB connection closed due to app termination.");
    process.exit(0);
  });
};

export default connectDB;