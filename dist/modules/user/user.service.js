"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    constructor() { }
    profile = async (req, res, next) => {
        return res.json({ message: "Done", data: { user: req.user, decoded: req.decoded } });
    };
}
exports.UserService = UserService;
exports.default = new UserService();
