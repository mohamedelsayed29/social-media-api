"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEventEmitter = void 0;
const node_events_1 = __importDefault(require("node:events"));
const send_email_1 = require("../email/send.email");
const verify_template_email_1 = require("../../templates/verify.template.email");
exports.emailEventEmitter = new node_events_1.default();
exports.emailEventEmitter.on("confirmationEmail", async (data) => {
    try {
        data.subject = "confirmation email";
        data.html = (0, verify_template_email_1.verifyEmailTemplate)({ otp: data.otp, title: "Email Confirmation" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.error("Error sending confirmation email:", error);
    }
});
