import { NextFunction , Request ,Response } from "express";
import { ForbiddenException, UnauthorizedException } from "../utils/response/error.responce";
import { decodeToken, TokenTypeEnum } from "../utils/security/token.security";
import { RoleEnum } from "../db/models/user.model";
 

export const authenticationMiddleware = (tokenType :TokenTypeEnum  = TokenTypeEnum.access)=>{
    return async(req:Request,res:Response,next:NextFunction)=>{
        if(!req.headers.authorization) throw new UnauthorizedException("Missing authorization header")
        const {decoded , user} = await decodeToken({authorization: req.headers.authorization , tokenType })
        req.user = user;
        req.decoded = decoded;
        next();
    }
} 
export const authorizationMiddleware = (accessRoles:RoleEnum[] = [],tokenType :TokenTypeEnum  = TokenTypeEnum.access)=>{
    return async(req:Request,res:Response,next:NextFunction)=>{
        if(!req.headers.authorization) throw new UnauthorizedException("Missing authorization header")

        const {decoded , user} = await decodeToken({authorization: req.headers.authorization , tokenType})

        if(!accessRoles.includes(user.role)) throw new ForbiddenException("not authorize account")
            
        req.user = user;
        req.decoded = decoded;
        next();
    }
} 