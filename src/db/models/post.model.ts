import { HydratedDocument, model, models, Schema, Types } from "mongoose";
export enum AllowCommentsEnum{
    allow = "allow",
    disallow = "disallow"
}
export enum AvailabilityEnum{
    public = "PUBLIC",
    friends = "FRIENDS",
    onlyMe = "ONLY_ME"
}

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

const postSchema = new Schema<IPost>({
    content:{type:String , minLength:2 , maxLength:50000 , required:function(this:IPost){
        return !this.attachments?.length 
    }},
    attachments:[String],
    assetPostFolderId:String,
    allowComments:{type:String , enum:AllowCommentsEnum , default:AllowCommentsEnum.allow},
    availability:{type:String , enum:AvailabilityEnum , default:AvailabilityEnum.public},
    tags:[{type:Schema.Types.ObjectId , ref:"User"}],
    likes:[{type:Schema.Types.ObjectId , ref:"User"}],
    freezeedBy:{type:Schema.Types.ObjectId , ref:"User"},
    freezeedAt:{type:Date},
    restoredBy:{type:Schema.Types.ObjectId , ref:"User"},
    restoredAt:{type:Date},
    createdBy:{type:Schema.Types.ObjectId , ref:"User" , required:true}
},{timestamps:true})

export const PostModel = models.Post || model<IPost>("Post" , postSchema)
export type HPostDocument = HydratedDocument<IPost>