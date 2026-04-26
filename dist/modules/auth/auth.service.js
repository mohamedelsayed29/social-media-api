"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const error_responce_1 = require("../../utils/response/error.responce");
const user_repository_1 = require("../../db/repository/user.repository");
const hash_security_1 = require("../../utils/security/hash.security");
class AuthenticationService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        let { username, firstName, lastName, email, password, phoneNumber, } = req.body;
        console.log(req.body);
        const checkUser = await this._userModel.findOne({ filter: { email }, select: "email", options: { lean: true } });
        console.log(checkUser);
        if (checkUser)
            throw new error_responce_1.ConflictException("Email already exists");
        const [user] = await this._userModel.create({
            data: [{
                    username,
                    firstName,
                    lastName,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    phoneNumber,
                }],
            options: { validateBeforeSave: true }
        }) || [];
        return res.status(201).json({ message: "Signup successful", data: { user } });
    };
    login = async (req, res) => {
        return res.status(200).json({ message: "login successful", data: req.body });
    };
}
exports.default = new AuthenticationService();
