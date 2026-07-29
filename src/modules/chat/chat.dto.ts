import { IAuthSocket } from "../gateway/gateway.dto";
import { addGroupMembersSchema, createGroupSchema, getChatSchema, getGroupSchema } from "./chat.validation";
import z from 'zod'
import { Server } from "socket.io";


export interface ISayHiDTO {
    message:string;
    socket:IAuthSocket;
    callback:any
}

export interface ISendMessageDTO {
    content:string;
    socket:IAuthSocket;
    sendTo:string;
    io:Server;
    connectedSocketIds:Map<string,string[]>
}

export interface ISendGroupMessageDTO {
    content:string;
    socket:IAuthSocket;
    groupId:string;
    io:Server;
    connectedSocketIds:Map<string,string[]>
}

export type GetChatDTO = z.infer<typeof getChatSchema.params>
export type CreateGroupDTO = z.infer<typeof createGroupSchema.body>
export type GetGroupDTO = z.infer<typeof getGroupSchema.params>
export type AddGroupMembersDTO = z.infer<typeof addGroupMembersSchema.params>
