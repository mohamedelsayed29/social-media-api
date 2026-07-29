import { Types } from "mongoose";

export type NotificationType = "friend_request" | "post_like";

export interface INotification {
    recipient:Types.ObjectId;
    actor:Types.ObjectId;
    type:NotificationType;
    message:string;
    post?:Types.ObjectId;
    friendRequest?:Types.ObjectId;
    readAt?:Date;
    createdAt?:Date;
    updatedAt?:Date;
}
