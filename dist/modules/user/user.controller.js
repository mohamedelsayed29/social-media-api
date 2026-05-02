"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const user_service_1 = __importDefault(require("./user.service"));
const user_authorization_1 = require("./user.authorization");
const router = (0, express_1.Router)();
router.get("/profile", (0, authentication_middleware_1.authorizationMiddleware)(user_authorization_1.endPoint.profile), user_service_1.default.profile);
exports.default = router;
