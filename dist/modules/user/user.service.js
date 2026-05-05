"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const token_security_1 = require("../../utils/security/token.security");
const user_model_1 = require("../../db/models/user.model");
const user_repository_1 = require("../../db/repository/user.repository");
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    profile = async (req, res, next) => {
        return res.json({ message: "Done", data: { user: req.user, decoded: req.decoded } });
    };
    logout = async (req, res, next) => {
        const { flag } = req.body;
        const update = {};
        let statusCode = 200;
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this._userModel.updateOne({
            filter: { _id: req.decoded?.userId },
            update
        });
        return res.status(statusCode).json({ message: "Done" });
    };
    refreshToken = async (req, res, next) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({ message: "Done", data: { credentials } });
    };
}
exports.UserService = UserService;
exports.default = new UserService();
