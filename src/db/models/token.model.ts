import { HydratedDocument, model, models, Schema } from "mongoose";
import { IToken } from "../../common/interface/token.interface";


const tokenSchema = new Schema<IToken>({

    jti:{type:String , required:true , unique:true},
    expiersIn:{type:Number,required:true},
    userId: {type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true})

export const TokenModel = models.Token || model<IToken>("Token" , tokenSchema)
export type HTokenDocument = HydratedDocument<IToken>