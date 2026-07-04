import z from "zod"
import { generalFields } from "../../middleware/validation.middleware"
import { fileValidation } from "../../utils/multer/cloud.multer"
import { AllowCommentsEnum, AvailabilityEnum, likeActionEnum } from "../../common/enums/post.enum"

export const createPostSchema = {
    body:z.strictObject({
        content:z.string().min(2).max(50000).optional(),
        attachments:z.array(generalFields.file(fileValidation.images )).max(3).optional(),
        allowComments:z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        availability:z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        tags:z.array(generalFields.id).max(10).optional(),
    }).superRefine((data,ctx)=>{
        if(!data.attachments?.length && !data.content){
            ctx.addIssue({
                code:"custom",
                path:["content"],
                message:"Please Provide Content or Attachment"
            })
        }
        if(data.tags?.length && data.tags.length !== [...new Set(data.tags)].length){
            ctx.addIssue({
                code:"custom",
                path:["tags"],
                message:"Please Provide Unique tags"
            })
        }
    })
}

export const likePostSchema = {
    params:z.strictObject({
        postId:generalFields.id
    }),
    query:z.strictObject({
        action:z.enum(likeActionEnum).default(likeActionEnum.like)
    })
}