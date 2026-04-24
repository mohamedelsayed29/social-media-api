"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.TooManyRequestsException = exports.ConflictException = exports.ForbiddenException = exports.TokenExpiredException = exports.UnauthorizedException = exports.InternalServerErrorException = exports.NotFoundException = exports.BadRequestException = exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode, options) {
        super(message, options);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
class BadRequestException extends ApplicationException {
    constructor(message = "Bad Request", options) {
        super(message, 400, options);
    }
}
exports.BadRequestException = BadRequestException;
class NotFoundException extends ApplicationException {
    constructor(message = "Not Found", options) {
        super(message, 404, options);
    }
}
exports.NotFoundException = NotFoundException;
class InternalServerErrorException extends ApplicationException {
    constructor(message = "Internal Server Error", options) {
        super(message, 500, options);
    }
}
exports.InternalServerErrorException = InternalServerErrorException;
class UnauthorizedException extends ApplicationException {
    constructor(message = "Unauthorized", options) {
        super(message, 401, options);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class TokenExpiredException extends ApplicationException {
    constructor(message = "Token has expired", options) {
        super(message, 401, options);
    }
}
exports.TokenExpiredException = TokenExpiredException;
class ForbiddenException extends ApplicationException {
    constructor(message = "Forbidden", options) {
        super(message, 403, options);
    }
}
exports.ForbiddenException = ForbiddenException;
class ConflictException extends ApplicationException {
    constructor(message = "Conflict", options) {
        super(message, 409, options);
    }
}
exports.ConflictException = ConflictException;
class TooManyRequestsException extends ApplicationException {
    constructor(message = "Too Many Requests", options) {
        super(message, 429, options);
    }
}
exports.TooManyRequestsException = TooManyRequestsException;
const globalErrorHandler = (error, req, res, next) => {
    console.error(error.stack);
    res.status(error.statusCode || 500).json({
        err_message: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        cause: error.cause,
        error,
    });
};
exports.globalErrorHandler = globalErrorHandler;
