import { Response,NextFunction, Request } from "express";
import { IFreezeAccountParams, IHardDeleteAccountParams, ILogoutDto, IRestoreAccountParams } from "./user.dto";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, RoleEnum, UserModel } from "../../db/models/user.model";
import { UserRepository } from "../../db/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { createPresignedUrl, deleteFiles, deleteFolderByPrefix, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { BadRequestException, ForbiddenException } from "../../utils/response/error.responce";
import { s3EventEmitter } from "../../utils/multer/s3.event";
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
        const user = await this._userModel.findByIdAndUpdate({
            id:req.decoded?.userId ,
            update:{profileImage:key,tempProfileImage:req.user?.profileImage},
        })
        if(!user) throw new BadRequestException("Failed to update user profile image")

        s3EventEmitter.emit("trackProfileImageUpload",{userId:req.decoded?.userId,oldImage:user.profileImage,newImage:key ,expiresIn:30000})
        
        return res.json({message:"Profile Image Uploaded Successfully",data:{url,key}})
    }

    profileCoverImage = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {

        const urls:string[] = await uploadFiles({
            storageApproach:StorageEnum.disk,
            files:req.files as Express.Multer.File[],
            Path:`users/${req.decoded?.userId}/cover-images`
        })
        const user = await this._userModel.findByIdAndUpdate({
            id:req.decoded?.userId ,
            update:{coverImage:urls},
        })
        if(!user) throw new BadRequestException("Failed to update user profile cover image")
        
        if(req.user?.coverImage){
            await deleteFiles({urls:req.user.coverImage})
        }

        return res.json({message:"Profile Cover Image Uploaded Successfully",data:{urls}})
    }

    freezeAccount = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        const {userId} = req.params as IFreezeAccountParams || {}
        if(userId && req.user?.role !== RoleEnum.admin) throw new ForbiddenException("You are not authorized to perform this action")
        
        const user = await this._userModel.updateOne({
            filter:{
                _id:userId || req.decoded?.userId,
                freezeedAt:{$exists:false}
            },
            update:{
                freezeedAt:new Date(),
                freezeedBy:req.decoded?.userId,
                changeCredentialTime:new Date(),
                $unset:{
                    restoredAt:1,
                    restoredBy:1
                }
            }
        })
        if(!user.matchedCount) throw new BadRequestException("Account is already frozen or does not exist")
        return res.json({message:"Done"})
    }

    restoreAccount = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        const {userId} = req.params as IRestoreAccountParams
        if(userId && req.user?.role !== RoleEnum.admin) throw new ForbiddenException("You are not authorized to perform this action")
        
        const user = await this._userModel.updateOne({
            filter:{
                _id:userId,
                freezeedAt:{$ne:userId}
            },
            update:{
                restoredAt:new Date(),
                restoredBy :req.decoded?.userId,
                changeCredentialTime:new Date(),
                $unset:{
                    freezeedAt:1,
                    freezeedBy:1
                }
            }
        })
        if(!user.matchedCount) throw new BadRequestException("Account is already restored or does not exist")
        return res.json({message:"Done"})
    }
    
    hardDeleteAccount = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        const {userId} = req.params as IHardDeleteAccountParams
        if(userId && req.user?.role !== RoleEnum.admin) throw new ForbiddenException("You are not authorized to perform this action")
        
        const user = await this._userModel.deleteOne({
            filter:{
                _id:userId,
                freezeedAt:{$exists:true }
            }
        })
        if(!user.deletedCount) throw new BadRequestException("user not found or hard delete failed")

        await deleteFolderByPrefix({path:`users/${userId}`})

        return res.json({message:"Done"})
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