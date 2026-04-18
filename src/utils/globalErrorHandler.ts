import { Request, Response } from "express";
export const globalErrorHandler = (err: Error, req: Request, res: Response) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};