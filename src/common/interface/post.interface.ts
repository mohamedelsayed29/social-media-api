import { Types } from "mongoose";
import { AllowCommentsEnum, AvailabilityEnum } from "../enums/post.enum";

export interface IPost{
    content?:string,
    attachments?:string[],
    assetPostFolderId:string,
    allowComments?:AllowCommentsEnum,
    availability?:AvailabilityEnum,
    tags?:Types.ObjectId[],
    likes?:Types.ObjectId[],
    freezeedBy?:Types.ObjectId,
    freezeedAt?:Date,
    restoredBy?:Types.ObjectId,
    restoredAt?:Date, 
    createdBy:Types.ObjectId,
    updatedAt?:Date,
    createdAt:Date
}