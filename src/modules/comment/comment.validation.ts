import z from "zod"
import { generalFields } from "../../middleware/validation.middleware"
import { fileValidation } from "../../utils/multer/cloud.multer"

export const createCommentSchema = {
    params:z.strictObject({
        postId:generalFields.id
    }),
    body:z.strictObject({
        content:z.string().min(2).max(50000).optional(),
        attachments:z.array(generalFields.file(fileValidation.images )).max(3).optional(),

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

export const createReplySchema = {
    params: createCommentSchema.params.extend({
        commentId:generalFields.id
    }),
    body:createCommentSchema.body
} 