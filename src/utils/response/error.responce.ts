import type { NextFunction, Request, Response } from "express";


export interface IError extends Error{
    statusCode:number;
}
export class ApplicationException extends Error{
    constructor(message:string, public statusCode:number , options?:ErrorOptions){
        super(message,options);
        this.name = this.constructor.name;
        Error.captureStackTrace(this,this.constructor);
    }
}
export class BadRequestException extends ApplicationException{
    constructor(message:string = "Bad Request", options?:ErrorOptions){
        super(message,400,options);
    }
}
export class NotFoundException extends ApplicationException{
    constructor(message:string = "Not Found", options?:ErrorOptions){
        super(message,404,options);
    }
}
export class InternalServerErrorException extends ApplicationException{
    constructor(message:string = "Internal Server Error", options?:ErrorOptions){
        super(message,500,options);
    }
}
export class UnauthorizedException extends ApplicationException{
    constructor(message:string = "Unauthorized", options?:ErrorOptions){
        super(message,401,options);
    }
}
export class TokenExpiredException extends ApplicationException {
  constructor(message:string = "Token has expired", options?: ErrorOptions) {
    super(message, 401,options);
  }
}
export class ForbiddenException extends ApplicationException{
    constructor(message:string = "Forbidden", options?:ErrorOptions){
        super(message,403,options);
    }
}
export class ConflictException extends ApplicationException{
    constructor(message:string = "Conflict", options?:ErrorOptions){
        super(message,409,options);
    }
}
export class TooManyRequestsException extends ApplicationException{
    constructor(message:string = "Too Many Requests", options?:ErrorOptions){
        super(message,429,options);
    }
}


export const globalErrorHandler = (error: IError, req: Request, res: Response , next:NextFunction) => {
    console.error(error.stack);
    res.status(error.statusCode ||500).json({ 
        err_message: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        cause: error.cause,
        error,
    });
};