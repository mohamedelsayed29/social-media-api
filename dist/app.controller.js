"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const error_responce_1 = require("./utils/response/error.responce");
const connection_db_1 = __importDefault(require("./db/connection.db"));
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "Too many requests from this IP, please try again after an hour" },
    statusCode: 429,
});
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    app.use(express_1.default.json(), (0, helmet_1.default)(), (0, cors_1.default)());
    app.use(limiter);
    app.get('/', (req, res) => {
        res.json({ message: "Welcome to the Social App" });
    });
    app.use("/api/auth", auth_controller_1.default);
    app.all('{/*dummy}', (req, res) => {
        res.status(404).json({ error: "Route not found" });
    });
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
    app.use(error_responce_1.globalErrorHandler);
    await (0, connection_db_1.default)();
};
exports.default = bootstrap;
