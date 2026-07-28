import { NextFunction, Request, Response } from "express";
import { GetChatDTO, ISayHiDTO, ISendMessageDTO } from "./chat.dto";
import { ChatModel } from "../../db/models/chat.model";
import { ChatRepository } from "../../db/repository/chat.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { UserModel } from "../../db/models/user.model";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce";


export class ChatService {
    constructor(){}
    private _chatModel = new ChatRepository(ChatModel)
    private _userModel = new UserRepository(UserModel)

    // REST API
    getChat = async(req:Request , res:Response , next:NextFunction)=>{

        const {userId} = req.params as GetChatDTO;

        //OVO
        const chat = await this._chatModel.findOne({
            filter:{
                participants:{
                    $all:[req.user?._id as Types.ObjectId , Types.ObjectId.createFromHexString(userId)]
                },
                group:{$exists:false}
            },
            options:{populate:"participants"}
        });
        if(!chat) throw new NotFoundException("Fail to find Data")

        return res.status(200).json({message:"Done" , data:{chat}})
    }

    // IO
    sayHi = ({message , socket , callback}:ISayHiDTO)=>{
        try {
            console.log(message);
            
            callback ? callback("I recived Your message") : undefined 
        } catch (error) {
            socket.emit("custom_error" , error)
        }
    }

    sendMessage = async({content , socket , sendTo}:ISendMessageDTO)=>{
        try {
            const createdBy = socket.credentials?.user?._id as Types.ObjectId 
            const user = await this._userModel.findOne({
                filter:{
                    _id:Types.ObjectId.createFromHexString(sendTo),
                    frindes:{$in: [createdBy]}
                }
            })
            if(!user) throw new NotFoundException("user not found ")
            
            const chat = await this._chatModel.findOneAndUpdate({
                filter:{
                    participants:{
                        $all:[createdBy as Types.ObjectId , Types.ObjectId.createFromHexString(sendTo)]
                    },
                  group:{$exists:false}
                },
                update:{
                    $addToSet:{
                        messages:{
                            content,
                            createdBy
                        }
                    }
                }
            })
            if(!chat) {
                const newChat = await this._chatModel.create({
                    data:[{
                        createdBy,
                        messages:[{content , createdBy}],
                        participants:[createdBy,Types.ObjectId.createFromHexString(sendTo)]

                    }]
                }) || []
                if(!newChat) throw new BadRequestException("fail to create new chat")
            }
            socket.emit("successMessage",{content})
        } catch (error) {
            socket.emit("custom_error" , error)
        }
    }
}

export const chatService = new ChatService()