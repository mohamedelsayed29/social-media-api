import { Types } from "mongoose";

export interface IFriendRequest{
    createdBy:Types.ObjectId;
    sendTo:Types.ObjectId;
    acceptedAt?:Date;
    createdAt:Date;
    updatedAt?:Date;
}