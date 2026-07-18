import { Request,Response } from "express"
import { HPostDocument, PostModel } from "../../db/models/post.model"
import { UserModel } from "../../db/models/user.model"
import { PostRepository } from "../../db/repository/post.repository"
import { UserRepository } from "../../db/repository/user.repository"
import { CommentModel } from "../../db/models/comment.model"
import { CommentRepository } from "../../db/repository/comment.repository"
import { Types } from "mongoose"
import { AllowCommentsEnum } from "../../common/enums/post.enum"
import { postAvailability } from "../post"
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce"
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config"

class CommentService{
    private _postModel = new PostRepository(PostModel)
    private _userModel = new UserRepository(UserModel)
    private _commentModel = new CommentRepository(CommentModel)
    constructor(){}

    createComment = async(req:Request , res:Response):Promise<Response>=>{
        const {postId} = req.params as unknown as {postId:Types.ObjectId}
        const post = await this._postModel.findOne({
            filter:{
                _id:postId,
                allowComments:AllowCommentsEnum.allow,
                $or:postAvailability(req,res)
            }
        })
        if(!post){
            throw new NotFoundException("Post Not Found or Comments are not allowed")
        }
        if(
            req.body.tags?.length && (await this._userModel.find({filter:{_id:{$in:req.body.tags , $ne:req.user?._id}}}))
            .length !== req.body.tags.length
        ){
            throw new NotFoundException("Some Mentioned User does not exists")
        }

        let attachments:string[] = [];
        if(req.files?.length){
            attachments = await uploadFiles({files:req.files as Express.Multer.File[],
                Path:`users/${post.createdBy}/posts/${post.assetPostFolderId}`
            })
        }

        const [comment] = await this._commentModel.create({data:[{
            ...req.body,
            attachments,
            postId:post._id,
            createdBy:req.user?._id
        }]}) || []

        if(!comment ){
            if(attachments.length){
                await deleteFiles({urls:attachments})
            }
            throw new BadRequestException("Fail to Create Comment")
        }
        return res.status(201).json({message:"Comment Created"})
    }

    createReply = async(req:Request , res:Response):Promise<Response>=>{
        const {commentId , postId} = req.params as unknown as {commentId:Types.ObjectId, postId:Types.ObjectId}
        const comment = await this._commentModel.findOne({
            filter:{
                _id:commentId,
                postId:postId,
                createdBy:req.user?._id
            },
            options:{
                populate:[{path:"postId", match:{allowComments:AllowCommentsEnum.allow , $or:postAvailability(req,res)}, select:"_id allowComments createdBy assetPostFolderId"}]
            }
        })
        if(!comment?.postId){
            throw new NotFoundException("Comment Not Found")
        }
        if(
            req.body.tags?.length && (await this._userModel.find({filter:{_id:{$in:req.body.tags , $ne:req.user?._id}}}))
            .length !== req.body.tags.length
        ){
            throw new NotFoundException("Some Mentioned User does not exists")
        }

        let attachments:string[] = [];
        if(req.files?.length){
            const post = comment.postId as unknown as Partial<HPostDocument>
            attachments = await uploadFiles({files:req.files as Express.Multer.File[],
                Path:`users/${post.createdBy}/posts/${post.assetPostFolderId}/replies`
            })
        }

        const [reply] = await this._commentModel.create({data:[{
            ...req.body,
            attachments,
            postId:comment.postId,
            createdBy:req.user?._id,
            commentId:comment._id
        }]}) || []

        if(!reply ){
            if(attachments.length){
                await deleteFiles({urls:attachments})
            }
            throw new BadRequestException("Fail to Create Reply")
        }
        return res.status(201).json({message:"Reply Created", data:reply})
    }
}
 
export const commentService =  new CommentService() 