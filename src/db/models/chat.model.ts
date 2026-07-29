import {HydratedDocument, model, models, Schema } from "mongoose"
import { IChat, IMessage } from "../../common/interface/chat.interface"

const messageSchema = new Schema<IMessage>({

    content:{
        type:String,
        required:true,
        maxlength:50000000,
        minLength:1

    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
  
},{timestamps:true , strictQuery:true})

const groupMemberSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    role:{
        type:String,
        enum:["admin","member"],
        default:"member",
        required:true
    }
},{_id:false})

const chatSchema = new Schema<IChat>({
    participants:[
        {
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    ],
    members:[groupMemberSchema],
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    group:String,
    groupDescription:String,
    groupImage:String,
    roomId:{
        type:String,
        required:function(){
            return this.roomId
        }
    },
    messages:[messageSchema]
},{timestamps:true , strictQuery:true})


export type HChatDocument = HydratedDocument<IChat>
export type HMessageDocument = HydratedDocument<IMessage>



export const ChatModel = models.chat || model<IChat>("chat" , chatSchema)
