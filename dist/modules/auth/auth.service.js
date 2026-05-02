"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const error_responce_1 = require("../../utils/response/error.responce");
const user_repository_1 = require("../../db/repository/user.repository");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        let { username, firstName, lastName, email, password, phoneNumber, } = req.body;
        console.log(req.body);
        const checkUser = await this._userModel.findOne({ filter: { email }, select: "email", options: { lean: true } });
        if (checkUser)
            throw new error_responce_1.ConflictException("Email already exists");
        const otp = (0, otp_1.generateNumberOtp)();
        const [user] = await this._userModel.create({
            data: [{
                    username,
                    firstName,
                    lastName,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    phoneNumber,
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp))
                }],
            options: { validateBeforeSave: true }
        }) || [];
        email_event_1.emailEventEmitter.emit("confirmationEmail", {
            to: email,
            otp: otp
        });
        return res.status(201).json({ message: "Signup successful", data: { user } });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user)
            throw new error_responce_1.NotFoundException("User not found");
        if (!user.confirmedAt)
            throw new error_responce_1.BadRequestException("Please confirm your email before logging in");
        if (!await (0, hash_security_1.compareHash)(password, user.password))
            throw new error_responce_1.NotFoundException("Invalid login Data");
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.status(200).json({ message: "login successful", data: { credentials } });
    };
    confirmEmail = async (req, res) => {
        let { email, otp } = req.body;
        console.log(email, otp);
        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user)
            throw new error_responce_1.ConflictException("Invalid email or email already confirmed");
        if (!await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp))
            throw new error_responce_1.ConflictException("Invalid OTP");
        await this._userModel.updateOne({
            filter: { email },
            update: {
                $set: { confirmedAt: new Date() },
                $unset: { confirmEmailOtp: 1 }
            }
        });
        return res.status(200).json({ message: "Email confirmed" });
    };
}
exports.default = new AuthenticationService();
