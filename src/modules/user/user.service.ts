import { Response,NextFunction, Request } from "express";
import { ILogoutDto } from "./user.dto";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../db/models/user.model";
import { UserRepository } from "../../db/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { createPresignedUrl, uploadfile, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
export class UserService {
    private _userModel = new UserRepository(UserModel) 
    
    constructor(){}

    profile = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        return res.json({message:"Done",data:{user:req.user,decoded:req.decoded}})
    }

    profileImage = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        // const key = await uploadfile({
        //     file:req.file as Express.Multer.File,
        //     Path:`users/${req.decoded?.userId}/profile-image`,
        // })
        // return res.json({message:"Profile Image Uploaded Successfully",data:{key}})
        const {contentType,originalname}:{contentType:string,originalname:string} = req.body
        const {url , key} = await createPresignedUrl({
            contentType,
            originalname,
            Path:`users/${req.decoded?.userId}/profile-image`
        })
        return res.json({message:"Profile Image Uploaded Successfully",data:{url,key}})
    }

    profileCoverImage = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        const urls:string[] = await uploadFiles({
            storageApproach:StorageEnum.disk,
            files:req.files as Express.Multer.File[],
            Path:`users/${req.decoded?.userId}/cover-images`
        })

        return res.json({message:"Profile Cover Image Uploaded Successfully",data:{urls}})
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
                await createRevokeToken(req.decoded as JwtPayload )
                statusCode = 201;
                break;
        }
        await this._userModel.updateOne({
            filter:{_id:req.decoded?.userId},
            update
        })
        return res.status(statusCode).json({message:"Done"})
    }

    refreshToken = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const credentials = await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload )
        return res.status(201).json({message:"Done" , data:{credentials}} )
    }
}

export default new UserService();