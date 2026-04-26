"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const error_responce_1 = require("../response/error.responce");
const sendEmail = async (data) => {
    if (!data.html && !data.attachments?.length && !data.text)
        throw new error_responce_1.BadRequestException("missing email content");
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        ...data,
        from: `${process.env.APPLICATION_NAME} - <${process.env.EMAIL}>`,
    });
    console.log("Message sent: %s", info.messageId);
};
exports.sendEmail = sendEmail;
