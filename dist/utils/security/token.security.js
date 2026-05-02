"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.createLoginCredentials = exports.getSignatures = exports.detectSignatureLevel = exports.verifyToken = exports.generateToken = exports.TokenTypeEnum = exports.SignatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = require("../../db/models/user.model");
const error_responce_1 = require("../response/error.responce");
const user_repository_1 = require("../../db/repository/user.repository");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["Bearer"] = "Bearer";
    SignatureLevelEnum["System"] = "System";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum["access"] = "access";
    TokenTypeEnum["refresh"] = "refresh";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, }) => {
    return (0, jsonwebtoken_1.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const detectSignatureLevel = async (role = user_model_1.RoleEnum.user) => {
    let signatureLevel = SignatureLevelEnum.Bearer;
    switch (role) {
        case user_model_1.RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System;
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer;
    }
    return signatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const getSignatures = async (signatureLevel = SignatureLevelEnum.Bearer) => {
    let signatures = { access_signature: "", refresh_signature: "" };
    switch (signatureLevel) {
        case SignatureLevelEnum.System:
            signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
            break;
        default:
            signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    console.log(signatures);
    const accessToken = await (0, exports.generateToken)({
        payload: { userId: user._id, role: user.role },
        secret: signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) }
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { userId: user._id },
        secret: signatures.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) }
    });
    return { accessToken, refreshToken };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenTypeEnum.access }) => {
    const userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    const [BearerKey, token] = authorization.split(" ");
    if (!BearerKey || !token)
        throw new error_responce_1.UnauthorizedException("missing token Parts");
    const signatures = await (0, exports.getSignatures)(BearerKey);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenTypeEnum.refresh
            ? signatures.refresh_signature
            : signatures.access_signature
    });
    if (!decoded?._id || !decoded?.iat)
        throw new error_responce_1.UnauthorizedException("Invalid token data");
    const user = await userModel.findById({ id: decoded._id });
    if (!user)
        throw new error_responce_1.UnauthorizedException("User not found");
    return { user, decoded };
};
exports.decodeToken = decodeToken;
