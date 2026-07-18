import { Types } from "mongoose";

export interface IComment{
    content?:string,
    attachments?:string[],

    tags?:Types.ObjectId[],
    likes?:Types.ObjectId[],

    postId?:Types.ObjectId,
    commentId?:Types.ObjectId,

    freezeedBy?:Types.ObjectId,
    freezeedAt?:Date,
    restoredBy?:Types.ObjectId,
    restoredAt?:Date, 
    createdBy:Types.ObjectId,
    updatedAt?:Date,
    createdAt:Date
    
}