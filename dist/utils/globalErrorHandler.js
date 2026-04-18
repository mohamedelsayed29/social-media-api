"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const globalErrorHandler = (err, req, res) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.globalErrorHandler = globalErrorHandler;
