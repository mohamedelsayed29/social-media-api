import { HydratedDocument, model, models, Schema, Types } from "mongoose";


export interface IToken{
    jti:string,
    expiersIn:number,
    userId:Types.ObjectId

}

const tokenSchema = new Schema<IToken>({

    jti:{type:String , required:true , unique:true},
    expiersIn:{type:Number,required:true},
    userId: {type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true})

export const TokenModel = models.Token || model<IToken>("Token" , tokenSchema)
export type HTokenDocument = HydratedDocument<IToken>