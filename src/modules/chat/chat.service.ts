import { NextFunction, Request, Response } from "express";
import { AddGroupMembersDTO, CreateGroupDTO, GetChatDTO, GetGroupDTO, ISayHiDTO, ISendGroupMessageDTO, ISendMessageDTO } from "./chat.dto";
import { ChatModel } from "../../db/models/chat.model";
import { ChatRepository } from "../../db/repository/chat.repository";
import { UserRepository } from "../../db/repository/user.repository";
import { UserModel } from "../../db/models/user.model";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../utils/response/error.responce";
import { FriendRequestModel } from "../../db/models/friendRequest.model";
import { deleteFile, uploadfile } from "../../utils/multer/s3.config";


export class ChatService {
    constructor(){}
    private _chatModel = new ChatRepository(ChatModel)
    private _userModel = new UserRepository(UserModel)

    private toId = (value:any):string=>{
        return value?._id?.toString?.() || value?.toString?.() || ""
    }

    private formatChat = (chat:any)=>{
        const plainChat = chat?.toObject ? chat.toObject() : chat
        const members = this.getGroupMembers(plainChat)
        return {
            ...plainChat,
            members,
            groupName:plainChat.group,
            description:plainChat.groupDescription,
        }
    }

    private getGroupMembers = (chat:any)=>{
        if(chat?.members?.length){
            return chat.members.map((member:any)=> ({
                user:member.user,
                role:member.role || "member"
            }))
        }
        return (chat?.participants || []).map((participant:any)=> ({
            user:participant,
            role:this.toId(participant) === this.toId(chat.createdBy) ? "admin" : "member"
        }))
    }

    private getGroupParticipantIds = (chat:any):string[]=>{
        const memberIds = (chat?.members || []).map((member:any)=> this.toId(member.user)).filter(Boolean)
        if(memberIds.length) return memberIds
        return (chat?.participants || []).map((participant:any)=> this.toId(participant)).filter(Boolean)
    }

    private getCurrentUserRole = (chat:any, userId:string):"admin" | "member" | ""=>{
        const member = this.getGroupMembers(chat).find((item:any)=> this.toId(item.user) === userId)
        return member?.role || ""
    }

    private parseParticipantIds = (value:unknown):string[]=>{
        if(Array.isArray(value)) return value.map((item)=> this.toId(item)).filter(Boolean)
        if(typeof value !== "string") return []
        try{
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed.map((item)=> this.toId(item)).filter(Boolean) : []
        }catch{
            return value.split(",").map((item)=> item.trim()).filter(Boolean)
        }
    }

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

    createGroup = async(req:Request , res:Response , next:NextFunction)=>{
        const {group, groupDescription} = req.body as CreateGroupDTO
        const participants = this.parseParticipantIds(req.body.participants)
        const currentUserId = req.user?._id as Types.ObjectId
        const currentUserIdString = currentUserId.toString()
        const uniqueParticipantIds = [...new Set(participants)]

        if(uniqueParticipantIds.length !== participants.length){
            throw new BadRequestException("Repeated user id in the same group is not allowed")
        }
        if(uniqueParticipantIds.includes(currentUserIdString)){
            throw new BadRequestException("You are already included in the group")
        }

        const participantObjectIds = uniqueParticipantIds.map((id)=> Types.ObjectId.createFromHexString(id))
        const users = await this._userModel.find({
            filter:{_id:{$in:participantObjectIds}}
        })
        if(users.length !== participantObjectIds.length){
            throw new NotFoundException("Some group members do not exist")
        }

        const friendships = await (FriendRequestModel as any).find({
            acceptedAt:{$exists:true},
            $or:[
                {createdBy:currentUserId,sendTo:{$in:participantObjectIds}},
                {sendTo:currentUserId,createdBy:{$in:participantObjectIds}},
            ]
        }).lean()
        const friendIds = new Set<string>()
        for (const friendship of friendships) {
            const createdBy = this.toId(friendship.createdBy)
            const sendTo = this.toId(friendship.sendTo)
            friendIds.add(createdBy === currentUserIdString ? sendTo : createdBy)
        }
        const missingFriend = uniqueParticipantIds.find((id)=> !friendIds.has(id))
        if(missingFriend){
            throw new BadRequestException("Groups can only include your friends")
        }

        let groupImage:string | undefined
        if(req.file){
            groupImage = await uploadfile({
                file:req.file as Express.Multer.File,
                Path:`users/${currentUserId}/groups`,
            })
        }

        const groupData = {
            group,
            ...(groupDescription ? {groupDescription} : {}),
            ...(groupImage ? {groupImage} : {}),
            createdBy:currentUserId,
            participants:[currentUserId,...participantObjectIds],
            members:[
                    {user:currentUserId,role:"admin" as const},
                    ...participantObjectIds.map((user)=> ({user,role:"member" as const}))
                ],
                messages:[],
                roomId:new Types.ObjectId().toString(),
            }

        const [groupChat] = await this._chatModel.create({
            data:[groupData]
        }) || []

        if(!groupChat){
            if(groupImage) await deleteFile({key:groupImage}).catch(() => undefined)
            throw new BadRequestException("Failed to create group")
        }

        const chat = await (ChatModel as any).findById(groupChat._id)
            .populate("participants","firstName lastName profileImage email")
            .populate("members.user","firstName lastName profileImage email")
            .populate("createdBy","firstName lastName profileImage email")

        return res.status(201).json({
            message:"Group Created Successfully",
            data:{chat:this.formatChat(chat)}
        })
    }

    getGroups = async(req:Request , res:Response , next:NextFunction)=>{
        const groups = await (ChatModel as any).find({
            group:{$exists:true},
            $or:[
                {participants:req.user?._id},
                {"members.user":req.user?._id}
            ]
        })
        .populate("participants","firstName lastName profileImage email")
        .populate("members.user","firstName lastName profileImage email")
        .populate("createdBy","firstName lastName profileImage email")
        .sort({updatedAt:-1})

        return res.status(200).json({
            message:"Done",
            data:{groups:groups.map((group:any)=> this.formatChat(group))}
        })
    }

    getGroup = async(req:Request , res:Response , next:NextFunction)=>{
        const {groupId} = req.params as GetGroupDTO
        const group = await (ChatModel as any).findOne({
            _id:groupId,
            group:{$exists:true},
            $or:[
                {participants:req.user?._id},
                {"members.user":req.user?._id}
            ]
        })
        .populate("participants","firstName lastName profileImage email")
        .populate("members.user","firstName lastName profileImage email")
        .populate("createdBy","firstName lastName profileImage email")
        .populate("messages.createdBy","firstName lastName profileImage email")

        if(!group) throw new NotFoundException("Group not found")

        return res.status(200).json({
            message:"Done",
            data:{chat:this.formatChat(group)}
        })
    }

    addGroupMembers = async(req:Request , res:Response , next:NextFunction)=>{
        const {groupId} = req.params as AddGroupMembersDTO
        const participants = this.parseParticipantIds(req.body.participants)
        const currentUserId = req.user?._id as Types.ObjectId
        const currentUserIdString = currentUserId.toString()
        const uniqueParticipantIds = [...new Set(participants)]

        if(uniqueParticipantIds.length !== participants.length){
            throw new BadRequestException("Repeated user id in the same group is not allowed")
        }
        if(uniqueParticipantIds.includes(currentUserIdString)){
            throw new BadRequestException("You are already in this group")
        }

        const group = await (ChatModel as any).findOne({
            _id:groupId,
            group:{$exists:true},
            $or:[
                {participants:currentUserId},
                {"members.user":currentUserId}
            ]
        })
        if(!group) throw new NotFoundException("Group not found")

        if(this.getCurrentUserRole(group, currentUserIdString) !== "admin"){
            throw new BadRequestException("Only group admins can add members")
        }

        const existingIds = new Set(this.getGroupParticipantIds(group))
        const repeatedMember = uniqueParticipantIds.find((id)=> existingIds.has(id))
        if(repeatedMember){
            throw new BadRequestException("Repeated user id in the same group is not allowed")
        }

        const participantObjectIds = uniqueParticipantIds.map((id)=> Types.ObjectId.createFromHexString(id))
        const users = await this._userModel.find({
            filter:{_id:{$in:participantObjectIds}}
        })
        if(users.length !== participantObjectIds.length){
            throw new NotFoundException("Some group members do not exist")
        }

        const friendships = await (FriendRequestModel as any).find({
            acceptedAt:{$exists:true},
            $or:[
                {createdBy:currentUserId,sendTo:{$in:participantObjectIds}},
                {sendTo:currentUserId,createdBy:{$in:participantObjectIds}},
            ]
        }).lean()
        const friendIds = new Set<string>()
        for (const friendship of friendships) {
            const createdBy = this.toId(friendship.createdBy)
            const sendTo = this.toId(friendship.sendTo)
            friendIds.add(createdBy === currentUserIdString ? sendTo : createdBy)
        }
        const missingFriend = uniqueParticipantIds.find((id)=> !friendIds.has(id))
        if(missingFriend){
            throw new BadRequestException("Groups can only include your friends")
        }

        await (ChatModel as any).updateOne(
            {_id:groupId},
            {
                $addToSet:{participants:{$each:participantObjectIds}},
                $push:{members:{$each:participantObjectIds.map((user)=> ({user,role:"member"}))}}
            }
        )

        const updatedGroup = await (ChatModel as any).findById(groupId)
            .populate("participants","firstName lastName profileImage email")
            .populate("members.user","firstName lastName profileImage email")
            .populate("createdBy","firstName lastName profileImage email")
            .populate("messages.createdBy","firstName lastName profileImage email")

        return res.status(200).json({
            message:"Members Added Successfully",
            data:{chat:this.formatChat(updatedGroup)}
        })
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

    sendMessage = async({content , socket , sendTo, io, connectedSocketIds}:ISendMessageDTO)=>{
        try {
            const sender = socket.credentials?.user
            if(!sender?._id) throw new BadRequestException("Authentication required")

            const createdBy = sender._id as Types.ObjectId
            const sendToId = Types.ObjectId.createFromHexString(sendTo)
            const user = await this._userModel.findOne({
                filter:{
                    _id:sendToId,
                    $or:[
                        {friends:{$in: [createdBy]}},
                        {"friends.type":createdBy}
                    ]
                }
            })
            if(!user) throw new NotFoundException("user not found ")

            const message = {
                content,
                createdBy
            }
            const chat = await this._chatModel.findOneAndUpdate({
                filter:{
                    participants:{
                        $all:[createdBy as Types.ObjectId , sendToId]
                    },
                  group:{$exists:false}
                },
                update:{
                    $push:{
                        messages:message
                    }
                },
                options:{new:true}
            })
            let chatId = chat?._id
            if(!chat) {
                const newChat = await this._chatModel.create({
                    data:[{
                        createdBy,
                        messages:[message],
                        participants:[createdBy,sendToId]

                    }]
                }) || []
                if(!newChat) throw new BadRequestException("fail to create new chat")
                chatId = newChat[0]?._id
            }
            const payload = {
                content,
                from:sender,
                chatId
            }
            const receiverSocketIds = connectedSocketIds.get(sendTo) || []
            for (const socketId of receiverSocketIds) {
                io.to(socketId).emit("newMessage",payload)
            }
            socket.emit("successMessage",{content, sendTo, chatId})
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong"
            socket.emit("custom_error" , {message})
        }
    }

    sendGroupMessage = async({content , socket , groupId, io, connectedSocketIds}:ISendGroupMessageDTO)=>{
        try {
            const sender = socket.credentials?.user
            if(!sender?._id) throw new BadRequestException("Authentication required")

            const createdBy = sender._id as Types.ObjectId
            const message = {
                content,
                createdBy
            }
            const chat = await (ChatModel as any).findOneAndUpdate(
                {
                    _id:groupId,
                    group:{$exists:true},
                    $or:[
                        {participants:createdBy},
                        {"members.user":createdBy}
                    ],
                },
                {$push:{messages:message}},
                {new:true}
            ).populate("participants","firstName lastName profileImage email")

            if(!chat) throw new NotFoundException("Group not found")

            const payload = {
                content,
                from:sender,
                groupId:chat._id,
                chatId:chat._id,
                createdAt:new Date().toISOString()
            }

            const participantIds = this.getGroupParticipantIds(chat)
            for (const participantId of participantIds) {
                const socketIds = connectedSocketIds.get(participantId) || []
                for (const socketId of socketIds) {
                    if(socketId === socket.id) continue
                    io.to(socketId).emit("newGroupMessage",payload)
                }
            }
            socket.emit("successGroupMessage",payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong"
            socket.emit("custom_error" , {message})
        }
    }
}

export const chatService = new ChatService()
