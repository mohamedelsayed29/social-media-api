import { Response,NextFunction, Request } from "express";
import { ILogoutDto } from "./user.dto";
import { LogoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { IUser, UserModel } from "../../db/models/user.model";
import { UserRepository } from "../../db/repository/user.repository";
import { TokenRepository } from "../../db/repository/token.repository";
import { TokenModel } from "../../db/models/token.model";
export class UserService {
    private _userModel = new UserRepository(UserModel) 
    private _tokenModel  = new TokenRepository(TokenModel) 
    
    constructor(){}

    profile = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        return res.json({message:"Done",data:{user:req.user,decoded:req.decoded}})
    }
    logout = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        const {flag}:ILogoutDto = req.body
        const update:UpdateQuery<IUser> = {}
        let statusCode:number = 200
        switch (flag) {
            case LogoutEnum.all:
                update.changeCredentialTime = new Date()
                break;
        
            default:
                await this._tokenModel.create({
                    data:[{
                        jti:req.decoded?.jti as string,
                        expiersIn: (req.decoded?.iat as number)+ Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                        userId:req.decoded?.userId
                    }]
                })
                statusCode = 201;
                break;
        }
        await this._userModel.updateOne({
            filter:{_id:req.decoded?.userId},
            update
        })
        return res.status(statusCode).json({message:"Done"})
    }
}

export default new UserService();