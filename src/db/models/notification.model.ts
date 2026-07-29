import { HydratedDocument, model, models, Schema } from "mongoose";
import { INotification } from "../../common/interface/notification.interface";

const notificationSchema = new Schema<INotification>({
    recipient:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    actor:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    type:{
        type:String,
        enum:["friend_request","post_like"],
        required:true
    },
    message:{
        type:String,
        required:true,
        maxLength:180
    },
    post:{
        type:Schema.Types.ObjectId,
        ref:"Post"
    },
    friendRequest:{
        type:Schema.Types.ObjectId,
        ref:"FriendRequest"
    },
    readAt:Date
},{timestamps:true})

export type HNotificationDocument = HydratedDocument<INotification>
export const NotificationModel = models.Notification || model<INotification>("Notification", notificationSchema)
