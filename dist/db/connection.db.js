"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connectDB = async () => {
    try {
        await (0, mongoose_1.connect)(process.env.DB_URI, { serverSelectionTimeoutMS: 3000 });
        console.log("Database connected successfully");
    }
    catch (error) {
        console.error("Error connecting to database:", error);
    }
};
exports.default = connectDB;
