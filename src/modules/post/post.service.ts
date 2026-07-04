import { Request, Response } from "express"
import { HPostDocument, PostModel } from "../../db/models/post.model"
import { PostRepository } from "../../db/repository/post.repository"
import { UserModel } from "../../db/models/user.model"
import { UserRepository } from "../../db/repository/user.repository"
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce"
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config"
import {v4 as uuid} from 'uuid'
import { likePostQueryInputsDto } from "./post.dto"
import { UpdateQuery } from "mongoose"
import { likeActionEnum } from "../../common/enums/post.enum"


class PostService{
    private _postModel = new PostRepository(PostModel)
    private _userModel = new UserRepository(UserModel)
    constructor(){}  

    createPost = async(req:Request , res:Response):Promise<Response>=>{
        if(
            req.body.tags?.length && (await this._userModel.find({filter:{_id:{$in:req.body.tags}}}))
            .length !== req.body.tags.length
        ){
            throw new NotFoundException("Some Mentioned User does not exists")
        }

        let attachments:string[] = [];
        let assetPostFolderId = uuid() ;

        if(req.files?.length){
            attachments = await uploadFiles({files:req.files as Express.Multer.File[],
                Path:`users/${req.user?._id}/posts/${assetPostFolderId}`
            })
        }

        const [post] = await this._postModel.create({data:[{
            ...req.body,
            attachments,
            assetPostFolderId,
            createdBy:req.user?._id
        }]}) || []

        if(!post ){
            if(attachments.length){
                await deleteFiles({urls:attachments})
            }
            throw new BadRequestException("Fail to Create Post")
        }
        return res.status(201).json({message:"Post Created"})
    }

    likePost  = async(req:Request , res:Response):Promise<Response>=>{
      const {postId} = req.params as {postId:string}
      const {action} = req.query as likePostQueryInputsDto;

      let update:UpdateQuery<HPostDocument> ={$addToSet:{likes:req.user?._id}}

        if(action === likeActionEnum.unlike){
            update = {$pull:{likes:req.user?._id}}
        }
      const post = await this._postModel.findOneAndUpdate({
            filter:{
                _id:postId
            },
            update
        })
        if(!post){
            throw new NotFoundException("invalid PostId or Post is not Exist ")
        }

      return res.status(200).json({message:"Done",post})
    }
}
 
export default new PostService() 