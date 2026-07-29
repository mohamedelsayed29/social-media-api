import { Response,NextFunction, Request } from "express";
import { IFreezeAccountParams, IHardDeleteAccountParams, ILogoutDto, IRestoreAccountParams } from "./user.dto";
import { createLoginCredentials, createRevokeToken } from "../../utils/security/token.security";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocument, UserModel } from "../../db/models/user.model";
import { UserRepository } from "../../db/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { deleteFile, deleteFiles, deleteFolderByPrefix, uploadfile, uploadFiles } from "../../utils/multer/s3.config";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../utils/response/error.responce";
import { successResponse } from "../../utils/response/success.response";
import { IProfileResponse,ICoverImageResponse } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";
import { LogoutEnum, RoleEnum, StorageEnum } from "../../common";
import { IUser } from "../../common/interface/user.interface";
import { IFriendRequest } from "../../common/interface/friendRequest.interface";
import { FriendRequestRepository } from "../../db/repository/friendRequest.repository";
import { FriendRequestModel } from "../../db/models/friendRequest.model";
import { PostModel } from "../../db/models/post.model";
import { formatPostsForResponse, postAvailability } from "../post";
import { createNotification } from "../notification/notification.service";
export class UserService {
    private _userModel = new UserRepository(UserModel)
    private _friendRequestModel = new FriendRequestRepository(FriendRequestModel)
    
    constructor(){}

    profile = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        if(!req.user) throw new BadRequestException("User not found")
        const user = await this._userModel.findById({
            id:req.user._id,
            options:{populate:"friends"}
        })
        if(!user) throw new BadRequestException("User not found")
        const acceptedFriends = await this.getAcceptedFriends(req.user._id)
        return successResponse({
            res,
            data:{user:{...this.userSummary(user),friends:acceptedFriends},decoded:req.decoded}
        })
    }

    private userSummary = (user:any)=>{
        const plainUser = user?.toObject ? user.toObject() : user
        return {
            _id:plainUser._id,
            username:plainUser.username || `${plainUser.firstName || ""} ${plainUser.lastName || ""}`.trim(),
            firstName:plainUser.firstName,
            lastName:plainUser.lastName,
            email:plainUser.email,
            phoneNumber:plainUser.phoneNumber,
            gender:plainUser.gender,
            address:plainUser.address,
            profileImage:plainUser.profileImage,
            coverImage:plainUser.coverImage || [],
            friends:plainUser.friends || [],
            createdAt:plainUser.createdAt
        }
    }

    private getUserId = (value:any):string=>{
        return value?._id?.toString?.() || value?.toString?.() || ""
    }

    private ensureFriendship = async(firstUserId:Types.ObjectId | string, secondUserId:Types.ObjectId | string)=>{
        await Promise.all([
            this._userModel.updateOne({
                filter:{_id:firstUserId},
                update:{$addToSet:{friends:secondUserId}}
            }),
            this._userModel.updateOne({
                filter:{_id:secondUserId},
                update:{$addToSet:{friends:firstUserId}}
            })
        ])
    }

    private removeFriendship = async(firstUserId:Types.ObjectId | string, secondUserId:Types.ObjectId | string)=>{
        await Promise.all([
            this._userModel.updateOne({
                filter:{_id:firstUserId},
                update:{$pull:{friends:secondUserId}}
            }),
            this._userModel.updateOne({
                filter:{_id:secondUserId},
                update:{$pull:{friends:firstUserId}}
            }),
            this._friendRequestModel.deleteMany({
                filter:{
                    createdBy:{$in:[firstUserId,secondUserId]},
                    sendTo:{$in:[firstUserId,secondUserId]},
                    acceptedAt:{$exists:true}
                }
            })
        ])
    }

    private getAcceptedFriends = async(userId:Types.ObjectId)=>{
        const acceptedRequests = await this._friendRequestModel.find({
            filter:{
                acceptedAt:{$exists:true},
                $or:[
                    {createdBy:userId},
                    {sendTo:userId}
                ]
            },
            options:{
                populate:[
                    {path:"createdBy",select:"firstName lastName profileImage email friends coverImage"},
                    {path:"sendTo",select:"firstName lastName profileImage email friends coverImage"}
                ]
            }
        })

        return acceptedRequests.map((request)=>{
            const createdBy = request.createdBy as any
            const sendTo = request.sendTo as any
            return this.getUserId(createdBy) === userId.toString()
                ? this.userSummary(sendTo)
                : this.userSummary(createdBy)
        })
    }

    updateProfile = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const update:Partial<IUser> = {}
        for (const key of ["firstName","lastName","phoneNumber","gender","address"] as const) {
            if(req.body[key] !== undefined) update[key] = req.body[key]
        }
        if(update.firstName || update.lastName){
            const firstName = update.firstName || req.user?.firstName
            const lastName = update.lastName || req.user?.lastName
            update.slug = `${firstName} ${lastName}`.replaceAll(/\s+/g,"-")
        }

        const user = await this._userModel.findByIdAndUpdate({
            id:req.user?._id?.toString() as string,
            update,
            options:{new:true}
        })
        if(!user) throw new BadRequestException("Failed to update profile")
        return successResponse({
            res,
            message:"Profile Updated Successfully",
            data:{user:this.userSummary(user)}
        })
    }

    searchUsers = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {q = ""} = req.query as {q?:string}
        const currentUserId = req.user?._id as Types.ObjectId
        const users = await this._userModel.find({
            filter:{
                _id:{$ne:currentUserId},
                ...(q ? {
                    $or:[
                        {firstName:{$regex:q,$options:"i"}},
                        {lastName:{$regex:q,$options:"i"}},
                        {email:{$regex:q,$options:"i"}},
                        {slug:{$regex:q.replaceAll(/\s+/g,"-"),$options:"i"}}
                    ]
                } : {})
            },
            options:{limit:20}
        })
        const userIds = users.map((user)=> user._id)
        const requests = await this._friendRequestModel.find({
            filter:{
                $or:[
                    {createdBy:currentUserId,sendTo:{$in:userIds}},
                    {createdBy:{$in:userIds},sendTo:currentUserId}
                ]
            }
        })

        const requestByUserId = new Map<string, IFriendRequest>()
        for (const request of requests) {
            const otherUserId = this.getUserId(request.createdBy) === currentUserId.toString()
                ? this.getUserId(request.sendTo)
                : this.getUserId(request.createdBy)
            requestByUserId.set(otherUserId, request)
        }

        return successResponse({
            res,
            data:{
                users:users.map((user)=>{
                    const request = requestByUserId.get(user._id.toString())
                    const isFriend = user.friends?.some((friendId)=> this.getUserId(friendId) === currentUserId.toString())
                    let friendshipStatus = isFriend || (request as any)?.acceptedAt ? "friend" : "none"
                    if(request){
                        if((request as any).acceptedAt){
                            friendshipStatus = "friend"
                        }else{
                            friendshipStatus = this.getUserId(request.createdBy) === currentUserId.toString()
                                ? "request_sent"
                                : "request_received"
                        }
                    }
                    return {
                        ...this.userSummary(user),
                        friendshipStatus,
                        requestId:(request as any)?._id
                    }
                })
            }
        })
    }

    publicProfile = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {userId} = req.params as {userId:string}
        const user = await this._userModel.findById({
            id:Types.ObjectId.createFromHexString(userId),
            options:{populate:"friends"}
        })
        if(!user) throw new NotFoundException("User not found")

        const posts = await (PostModel as any).find({
            createdBy:user._id,
            $or:postAvailability(req,res)
        })
        .populate("createdBy","firstName lastName profileImage email")
        .populate("tags","firstName lastName profileImage email")
        .sort({createdAt:-1})

        return successResponse({
            res,
            data:{
                user:this.userSummary(user),
                posts:await formatPostsForResponse(
                    posts,
                    req.user?._id,
                    (req.user?.savedPosts || []).map((postId:any)=> this.getUserId(postId))
                )
            }
        })
    }

    getFriendRequests = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {type = "incoming"} = req.query as {type?:"incoming"|"outgoing"}
        const currentUserId = req.user?._id as Types.ObjectId
        const requests = await this._friendRequestModel.find({
            filter:{
                acceptedAt:{$exists:false},
                ...(type === "incoming" ? {sendTo:currentUserId} : {createdBy:currentUserId})
            },
            options:{
                populate:[
                    {path:"createdBy",select:"firstName lastName profileImage email"},
                    {path:"sendTo",select:"firstName lastName profileImage email"}
                ]
            }
        })

        return successResponse({
            res,
            data:{requests}
        })
    }

    profileImage = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        if(!req.file) throw new BadRequestException("Please upload a profile image")
        const key = await uploadfile({
            file:req.file as Express.Multer.File,
            Path:`users/${req.decoded?.userId}/profile-image`,
        })
        const user = await this._userModel.findByIdAndUpdate({
            id:req.decoded?.userId ,
            update:{profileImage:key,$unset:{tempProfileImage:1}},
            options:{new:true}
        })
        if(!user) throw new BadRequestException("Failed to update user profile image")

        if(req.user?.profileImage){
            await deleteFile({key:req.user.profileImage}).catch(() => undefined)
        }
        
        return successResponse <IProfileResponse>({
            res,
            message:"Profile Image Uploaded Successfully",
            data:{user:this.userSummary(user)}
        })
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

        return successResponse<ICoverImageResponse>({
            res,
            message:"Profile Cover Image Uploaded Successfully",
            data:{user}
        })
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
        return successResponse({
            res,
            message:"Account Frozen Successfully"
        })
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
        return successResponse({
            res,
            message:"Account Restored Successfully"
        })
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

        return successResponse({
            res,
            message:"Account Deleted Successfully"
        })
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
        return successResponse<ILoginResponse >({
            res,
            statusCode:201,
            message:"Token Refreshed Successfully",
            data:{credentials}
        })
    }


    friendRequest = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {userId} = req.params as {userId:string}
        if(userId === req.user?._id?.toString()) throw new BadRequestException("You cannot send a friend request to yourself")
        const checkFriendRequest = await this._friendRequestModel.findOne({
            filter:{
                createdBy:{$in:[req.user?._id,userId]},
                sendTo:{$in:[req.user?._id,userId]}
            }
        })
        if(checkFriendRequest) {
            if((checkFriendRequest as any).acceptedAt){
                await this.ensureFriendship(req.user?._id as Types.ObjectId, userId)
                return successResponse({
                    res,
                    message:"Already Friends"
                })
            }
            throw new BadRequestException("Friend Request already sent or received")
        }
        const user = await this._userModel.findOne({
            filter:{_id:userId}
        })
        if(!user) throw new NotFoundException("User not found")
        if(user.friends?.some((friendId)=> this.getUserId(friendId) === req.user?._id?.toString())){
            throw new BadRequestException("User is already your friend")
        }
        const [friend] = await this._friendRequestModel.create({
            data:[{
                createdBy:req.user?._id as Types.ObjectId,
                sendTo:userId as unknown as Types.ObjectId
            }]
        }) || []
        if(!friend) throw new BadRequestException("Failed to send friend request")
        await createNotification({
            recipient:userId,
            actor:req.user?._id as Types.ObjectId,
            type:"friend_request",
            message:`${req.user?.username || "Someone"} sent you a friend request`,
            friendRequest:friend._id
        })
        return successResponse({
            res,
            message:"Friend Request Sent Successfully",
            data:{request:friend}
        })
    }

    acceptFriendRequest = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {requestId} = req.params as {requestId :string}
        const currentUserId = req.user?._id
        if(!currentUserId) throw new BadRequestException("Authentication required")

        const checkFriendRequest = await this._friendRequestModel.findOneAndUpdate({
            filter:{
                _id:requestId,
                sendTo:currentUserId,
                acceptedAt:{$exists:false}
            },
            update:{
                $set:{
                    acceptedAt:new Date()
                }
            },
            options:{ new: true }
        }) as IFriendRequest | null

        if(!checkFriendRequest) throw new BadRequestException("Friend Request not found or already accepted")

        await this.ensureFriendship(checkFriendRequest.createdBy, checkFriendRequest.sendTo)
       
        return successResponse({
            res,
            message:"Accept Friend Request Sent Successfully"
        })
    }

    rejectFriendRequest = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {requestId} = req.params as {requestId :string}
        const deletedRequest = await this._friendRequestModel.findOneAndDelete({
            filter:{
                _id:requestId,
                sendTo:req.user?._id,
                acceptedAt:{$exists:false}
            }
        })
        if(!deletedRequest) throw new BadRequestException("Friend Request not found")
        return successResponse({
            res,
            message:"Friend Request Rejected Successfully"
        })
    }

    cancelFriendRequest = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {requestId} = req.params as {requestId :string}
        const deletedRequest = await this._friendRequestModel.findOneAndDelete({
            filter:{
                _id:requestId,
                createdBy:req.user?._id,
                acceptedAt:{$exists:false}
            }
        })
        if(!deletedRequest) throw new BadRequestException("Friend Request not found")
        return successResponse({
            res,
            message:"Friend Request Canceled Successfully"
        })
    }

    deleteFriend = async(req:Request,res:Response,next:NextFunction):Promise<Response> =>{
        const {userId} = req.params as {userId:string}
        if(userId === req.user?._id?.toString()) throw new BadRequestException("You cannot delete yourself")
        const friendRequest = await this._friendRequestModel.findOne({
            filter:{
                createdBy:{$in:[req.user?._id,userId]},
                sendTo:{$in:[req.user?._id,userId]},
                acceptedAt:{$exists:true}
            }
        })
        if(!friendRequest) throw new BadRequestException("Friendship not found")
        await this.removeFriendship(req.user?._id as Types.ObjectId, userId)
        return successResponse({
            res,
            message:"Friend Deleted Successfully"
        })
    }
}

export default new UserService();
