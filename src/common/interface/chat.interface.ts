import { Types } from "mongoose"

export interface IChat{
    // OVO
    participants:Types.ObjectId[]
    messages:IMessage[]

    // OVM
    group?:string
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