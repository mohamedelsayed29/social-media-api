import { Schema, model, models, HydratedDocument } from "mongoose";

import { IFriendRequest } from "../../common/interface/friendRequest.interface";


const friendRequestSchema = new Schema<IFriendRequest>(
    {
       createdBy:{type:Schema.Types.ObjectId , ref:"User" , required:true},
       sendTo:{type:Schema.Types.ObjectId , ref:"User" , required:true},
       acceptedAt:{type:Date},
       createdAt:{type:Date , default:Date.now},
       updatedAt:{type:Date , default:Date.now},
    },
    {
        timestamps:true,

    }
);



export const FriendRequestModel = models.FriendRequest || model<IFriendRequest>("FriendRequest",friendRequestSchema)
export type HFriendRequestDocument = HydratedDocument<IFriendRequest>