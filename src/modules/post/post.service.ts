import { Request, Response } from "express"
import { HPostDocument, PostModel } from "../../db/models/post.model"
import { PostRepository } from "../../db/repository/post.repository"
import { UserModel } from "../../db/models/user.model"
import { UserRepository } from "../../db/repository/user.repository"
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce"
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config"
import {v4 as uuid} from 'uuid'
import { likePostQueryInputsDto } from "./post.dto"
import { Types, UpdateQuery } from "mongoose"
import { AvailabilityEnum, likeActionEnum, saveActionEnum } from "../../common/enums/post.enum"
import { CommentModel } from "../../db/models/comment.model"
import { emitPostCreated } from "./post.realtime"
import { createNotification } from "../notification/notification.service"


export const postAvailability = (req:Request , res:Response)=>{
    return[
        {availability:AvailabilityEnum.public},
        {availability:AvailabilityEnum.onlyMe , createdBy:req.user?._id as Types.ObjectId},
        {availability:AvailabilityEnum.friends ,
            createdBy:{$in:[...(req.user?.friends || []),req.user?._id]}
        },
        {availability:{$ne:AvailabilityEnum.onlyMe} ,
            tags: {
                $in: [req.user!._id]
            }
        },
    ]
}

const toId = (value:any):string => {
    return value?._id?.toString?.() || value?.toString?.() || ""
}

export const formatPostsForResponse = async(posts:any[], currentUserId?:Types.ObjectId, savedPostIds:string[] = [])=>{
    const postIds = posts.map((post)=> post._id)
    const comments = await (CommentModel as any).find({
        postId:{$in:postIds},
        commentId:{$exists:false}
    })
    .populate("createdBy","firstName lastName profileImage email")
    .sort({createdAt:1})
    .lean()

    const commentsByPost = new Map<string, any[]>()
    for (const comment of comments) {
        const postId = toId(comment.postId)
        const currentComments = commentsByPost.get(postId) || []
        currentComments.push({
            ...comment,
            author:comment.createdBy,
            likesCount:comment.likes?.length || 0,
            likedByMe:Boolean(currentUserId && comment.likes?.some((like:any)=> toId(like) === currentUserId.toString()))
        })
        commentsByPost.set(postId,currentComments)
    }

    return posts.map((post)=>{
        const plainPost = post?.toObject ? post.toObject() : post
        const postComments = commentsByPost.get(toId(plainPost._id)) || []
        return {
            ...plainPost,
            author:plainPost.createdBy,
            likesCount:plainPost.likes?.length || 0,
            commentsCount:postComments.length,
            likedByMe:Boolean(currentUserId && plainPost.likes?.some((like:any)=> toId(like) === currentUserId.toString())),
            savedByMe:savedPostIds.includes(toId(plainPost._id)),
            comments:postComments
        }
    })
}
 
class PostService{
    private _postModel = new PostRepository(PostModel)
    private _userModel = new UserRepository(UserModel)
    constructor(){}  

    private getPostRecipientIds = (post:any, creator:any):"all" | string[] => {
        if(post.availability === AvailabilityEnum.public) return "all"

        const creatorId = toId(creator?._id || creator)
        const recipientIds = new Set<string>([creatorId])

        if(post.availability === AvailabilityEnum.friends){
            for (const friendId of creator?.friends || []) {
                const id = toId(friendId)
                if(id) recipientIds.add(id)
            }
        }

        if(post.availability !== AvailabilityEnum.onlyMe){
            for (const tagId of post.tags || []) {
                const id = toId(tagId)
                if(id) recipientIds.add(id)
            }
        }

        return [...recipientIds].filter(Boolean)
    }

    createPost = async(req:Request , res:Response):Promise<Response>=>{
        if(
            req.body.tags?.length && (await this._userModel.find({filter:{_id:{$in:req.body.tags , $ne:req.user?._id}}}))
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
        const createdPost = await (PostModel as any).findById(post._id)
            .populate("createdBy","firstName lastName profileImage email")
            .populate("tags","firstName lastName profileImage email")
        const [formattedPost] = await formatPostsForResponse([createdPost], req.user?._id)
        emitPostCreated({
            post:formattedPost,
            recipientIds:this.getPostRecipientIds(post, req.user)
        })
        return res.status(201).json({message:"Post Created", data:{post:formattedPost}})
    }

    updatePost = async(req:Request , res:Response):Promise<Response>=>{

        const {postId} = req.params as unknown as {postId:Types.ObjectId}
        const post = await this._postModel.findOne({
            filter:{
                _id:postId,
                createdBy:req.user?._id,
            }
        })
        if(!post){
            throw new NotFoundException("Fail to find Match Result")
        }
        if(
            req.body.tags?.length && (await this._userModel.find({filter:{
                _id:{$in:req.body.tags , $ne:req.user?._id}}}))
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

        const updatedPost = await this._postModel.updateOne({
            filter:{_id:post._id},
            update:[
                {$set:{
                    content:req.body.content,
                    allowComments:req.body.allowComments || post.allowComments,
                    availability:req.body.availability || post.availability,
                    attachments:{
                        $setUnion:[
                            {
                                $setDifference:["$attachments",req.body.removedAttachments || []],
                            }, 
                            attachments
                        ]
                    },
                    tags:{
                        $setUnion:[
                            {
                                $setDifference:["$tags",(req.body.removedTags || []).map((tag:string)=>{
                                    return Types.ObjectId.createFromHexString(tag);
                                })],
                            },
                            (req.body.tags || []).map((tag:string)=>{
                                return Types.ObjectId.createFromHexString(tag);
                            })
                        ]
                    }
                }}
            ]
            
        })

        if(!updatedPost.modifiedCount){
            if(attachments.length){
                await deleteFiles({urls:attachments}) 
            }
            throw new BadRequestException("Fail to Update Post")
        }else{
            if(req.body.removedAttachments?.length){
                await deleteFiles({urls:req.body.removedAttachments})
            }
        }
        return res.status(200).json({message:"Post Updated "})
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
                _id:postId,
                $or: postAvailability(req, res)
            }, 
            update
        })
        if(!post){
            throw new NotFoundException("invalid PostId or Post is not Exist ")
        }

      const alreadyLiked = post.likes?.some((like:any)=> toId(like) === req.user?._id?.toString())
      if(action !== likeActionEnum.unlike && !alreadyLiked){
        await createNotification({
            recipient:post.createdBy,
            actor:req.user?._id as Types.ObjectId,
            type:"post_like",
            message:`${req.user?.username || "Someone"} liked your post`,
            post:post._id
        })
      }

      return res.status(200).json({message:"Done",post})
    }

    savePost = async(req:Request , res:Response):Promise<Response>=>{
      const {postId} = req.params as {postId:string}
      const {action} = req.query as {action:saveActionEnum}

      const post = await this._postModel.findOne({
        filter:{
            _id:postId,
            $or:postAvailability(req, res)
        }
      })
      if(!post){
        throw new NotFoundException("invalid PostId or Post is not Exist ")
      }

      const saved = action !== saveActionEnum.unsave
      await this._userModel.updateOne({
        filter:{_id:req.user?._id},
        update:saved
            ? {$addToSet:{savedPosts:post._id}}
            : {$pull:{savedPosts:post._id}}
      })

      return res.status(200).json({
        message:saved ? "Post Saved" : "Post Unsaved",
        data:{postId:post._id, saved}
      })
    }

    getPosts  = async(req:Request , res:Response):Promise<Response>=>{
        // let {page , size} = req.query as {page?:string , size?:string}
    //   const posts = await this._postModel.paginate({
    //     filter:{
    //         $or: postAvailability(req, res)
    //     },
    //     page : page ? parseInt(page) : 1,
    //     size : size ? parseInt(size) : 5
    //   })

        const posts = await (PostModel as any).find({
            $or: postAvailability(req, res)
        })
        .populate("createdBy","firstName lastName profileImage email")
        .populate("tags","firstName lastName profileImage email")
        .sort({createdAt:-1})

      return res.status(200).json({
        message:"Done",
        posts:await formatPostsForResponse(
            posts,
            req.user?._id,
            (req.user?.savedPosts || []).map((postId:any)=> toId(postId))
        )
      })
    }
}
 
export const postService =  new PostService()
