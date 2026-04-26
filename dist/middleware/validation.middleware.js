"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const error_responce_1 = require("../utils/response/error.responce");
const zod_1 = __importDefault(require("zod"));
const validation = (schema) => {
    return (req, res, next) => {
        const validationsErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult?.success) {
                const errors = validationResult.error;
                validationsErrors.push({ key, issues: errors.issues.map((issues) => {
                        return { message: issues.message, path: issues.path[0] };
                    })
                });
            }
        }
        if (validationsErrors.length) {
            throw new error_responce_1.BadRequestException("Validation Failed", { cause: validationsErrors });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.default.string().min(3).max(20),
    email: zod_1.default.email(),
    password: zod_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/),
    confirmPassword: zod_1.default.string(),
    firstName: zod_1.default.string().min(2).max(25),
    lastName: zod_1.default.string().min(2).max(25),
    phoneNumber: zod_1.default.string().regex(/^\+?[1-9]\d{1,14}$/),
    gender: zod_1.default.preprocess((val) => {
        if (typeof val === "string")
            return val.trim().toLowerCase();
        return val;
    }, zod_1.default.enum(["male", "female", "other"]).optional())
};
