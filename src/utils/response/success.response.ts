import { Response } from "express";
export const successResponse = <T = any | null>(
    { res, message = "Success", statusCode = 200, data }:{
        res: Response,
        message?: string,
        statusCode?: number,
        data?: T 
    }) => {
        return res.status(statusCode).json({
            statusCode,
            message,
            data
        });
}