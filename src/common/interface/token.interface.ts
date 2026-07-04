import { Types } from "mongoose";

export interface IToken{
    jti:string,
    expiersIn:number,
    userId:Types.ObjectId
}