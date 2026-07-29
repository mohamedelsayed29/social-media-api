import { Request, Response } from "express";
import { Types } from "mongoose";
import { NotificationModel } from "../../db/models/notification.model";
import { emitNotification } from "./notification.realtime";
import { INotification, NotificationType } from "../../common/interface/notification.interface";

const populateNotification = (query:any)=>{
    return query
        .populate("actor","firstName lastName profileImage email")
        .populate("post","content attachments availability")
        .populate("friendRequest")
}

export const createNotification = async({
    recipient,
    actor,
    type,
    message,
    post,
    friendRequest,
}:{
    recipient:Types.ObjectId | string;
    actor:Types.ObjectId | string;
    type:NotificationType;
    message:string;
    post?:Types.ObjectId | string;
    friendRequest?:Types.ObjectId | string;
})=>{
    if(recipient.toString() === actor.toString()) return null;
    const [notification] = await (NotificationModel as any).create([{
        recipient,
        actor,
        type,
        message,
        ...(post ? {post} : {}),
        ...(friendRequest ? {friendRequest} : {}),
    } as Partial<INotification>])
    const populated = await populateNotification((NotificationModel as any).findById(notification._id))
    if(populated){
        emitNotification({recipientId:recipient.toString(), notification:populated})
    }
    return populated
}

export class NotificationService {
    getNotifications = async(req:Request,res:Response):Promise<Response>=>{
        const recipient = req.user?._id as Types.ObjectId
        const notifications = await populateNotification(
            (NotificationModel as any).find({recipient}).sort({createdAt:-1}).limit(30)
        )
        const unreadCount = await (NotificationModel as any).countDocuments({
            recipient,
            readAt:{$exists:false}
        })
        return res.status(200).json({
            message:"Done",
            data:{notifications, unreadCount}
        })
    }

    markAllRead = async(req:Request,res:Response):Promise<Response>=>{
        await (NotificationModel as any).updateMany({
            recipient:req.user?._id as Types.ObjectId,
            readAt:{$exists:false}
        },{
            $set:{readAt:new Date()}
        })
        return res.status(200).json({message:"Notifications Read"})
    }
}

export const notificationService = new NotificationService()
