"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const token_security_1 = require("../../utils/security/token.security");
const user_model_1 = require("../../db/models/user.model");
const user_repository_1 = require("../../db/repository/user.repository");
const token_repository_1 = require("../../db/repository/token.repository");
const token_model_1 = require("../../db/models/token.model");
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    _tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
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
                await this._tokenModel.create({
                    data: [{
                            jti: req.decoded?.jti,
                            expiersIn: req.decoded?.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                            userId: req.decoded?.userId
                        }]
                });
                statusCode = 201;
                break;
        }
        await this._userModel.updateOne({
            filter: { _id: req.decoded?.userId },
            update
        });
        return res.status(statusCode).json({ message: "Done" });
    };
}
exports.UserService = UserService;
exports.default = new UserService();
