"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_repository_1 = require("../../db/repository/database.repository");
const user_model_1 = require("../../db/models/user.model");
const error_responce_1 = require("../../utils/response/error.responce");
class AuthenticationService {
    _userModel = new database_repository_1.DatabaseRepository(user_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        console.log({ username, email, password });
        const [user] = await this._userModel.create({ data: [{ username, email, password }], options: { validateBeforeSave: true } }) || [];
        if (!user)
            throw new error_responce_1.BadRequestException("Failed to create user");
        return res.status(201).json({ message: "Signup successful", data: user });
    };
    login = async (req, res) => {
        return res.status(200).json({ message: "login successful", data: req.body });
    };
}
exports.default = new AuthenticationService();
