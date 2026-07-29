import { Types } from "mongoose"

export type GroupRole = "admin" | "member"

export interface IGroupMember {
    user:Types.ObjectId
    role:GroupRole
}

export interface IChat{
    // OVO
    participants:Types.ObjectId[]
    members?:IGroupMember[]
    messages:IMessage[]

    // OVM
    group?:string
    groupDescription?:string
    groupImage?:string
    roomId?:string
    createdBy:Types.ObjectId;


}

export interface IMessage {
    content:string
    createdAt?:Date
    createdBy:Types.ObjectId;
    updatedAt?:Date
}
