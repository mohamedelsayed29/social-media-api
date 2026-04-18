"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthenticationService {
    constructor() { }
    signup(req, res) {
        return res.status(201).json({ message: "Signup successful", data: req.body });
    }
    login(req, res) {
        return res.status(200).json({ message: "login successful", data: req.body });
    }
}
exports.default = new AuthenticationService();
