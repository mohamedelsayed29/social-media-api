"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000;
const connectDB = async (retries = MAX_RETRIES) => {
    const uri = process.env.DB_URI;
    if (!uri) {
        console.error("DB_URI is not defined in environment variables.");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        console.log("✅ Database connected successfully");
        registerConnectionEvents();
    }
    catch (error) {
        console.error(`DB connection failed. Retries left: ${retries - 1}`, error);
        if (retries <= 1) {
            console.error("Max retries reached. Shutting down.");
            process.exit(1);
        }
        await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
        return connectDB(retries - 1);
    }
};
const registerConnectionEvents = () => {
    const db = mongoose_1.default.connection;
    db.on("disconnected", () => console.warn("MongoDB disconnected. Attempting to reconnect..."));
    db.on("reconnected", () => console.log("✅ MongoDB reconnected successfully."));
    db.on("error", (err) => console.error("MongoDB runtime error:", err));
    process.on("SIGINT", async () => {
        await db.close();
        console.log("MongoDB connection closed due to app termination.");
        process.exit(0);
    });
};
exports.default = connectDB;
