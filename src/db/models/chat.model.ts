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

const chatSchema = new Schema<IChat>({
   participants:[
    {        
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    } 
   ],
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    group:String,
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
