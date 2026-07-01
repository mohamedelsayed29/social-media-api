import { Request, Response } from "express"
import { PostModel } from "../../db/models/post.model"
import { PostRepository } from "../../db/repository/post.repository"
import { UserModel } from "../../db/models/user.model"
import { UserRepository } from "../../db/repository/user.repository"
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce"
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config"
import {v4 as uuid} from 'uuid'
class PostService{
    private _postModel = new PostRepository(PostModel)
    private _userModel = new UserRepository(UserModel)
    constructor(){} 
    createPost = async(req:Request , res:Response)=>{
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
}
 
export default new PostService() 