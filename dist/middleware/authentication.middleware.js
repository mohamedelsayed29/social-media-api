"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationMiddleware = exports.authenticationMiddleware = void 0;
const error_responce_1 = require("../utils/response/error.responce");
const token_security_1 = require("../utils/security/token.security");
const authenticationMiddleware = (tokenType = token_security_1.TokenTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization)
            throw new error_responce_1.UnauthorizedException("Missing authorization header");
        const { decoded, user } = await (0, token_security_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authenticationMiddleware = authenticationMiddleware;
const authorizationMiddleware = (accessRoles = [], tokenType = token_security_1.TokenTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization)
            throw new error_responce_1.UnauthorizedException("Missing authorization header");
        const { decoded, user } = await (0, token_security_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        if (!accessRoles.includes(user.role))
            throw new error_responce_1.ForbiddenException("not authorize account");
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authorizationMiddleware = authorizationMiddleware;
