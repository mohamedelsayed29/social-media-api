import { HydratedDocument, model, models, Schema } from "mongoose";
import { AllowCommentsEnum, AvailabilityEnum } from "../../common/enums/post.enum";
import { IPost } from "../../common";


const postSchema = new Schema<IPost>({
    content:{type:String , minLength:2 , maxLength:50000 , required:function(this:IPost){
        return !this.attachments?.length 
    }},
    attachments:[String],
    assetPostFolderId:String,
    allowComments:{type:String , enum:AllowCommentsEnum , default:AllowCommentsEnum.allow},
    availability:{type:String , enum:AvailabilityEnum , default:AvailabilityEnum.public},
    tags:[{type:Schema.Types.ObjectId , ref:"User"}],
    likes:[{type:Schema.Types.ObjectId , ref:"User"}],
    freezeedBy:{type:Schema.Types.ObjectId , ref:"User"},
    freezeedAt:{type:Date},
    restoredBy:{type:Schema.Types.ObjectId , ref:"User"},
    restoredAt:{type:Date},
    createdBy:{type:Schema.Types.ObjectId , ref:"User" , required:true}
},{timestamps:true , strictQuery:true})


postSchema.pre(["findOneAndUpdate","updateOne"],async function(next){
    const query = this.getQuery();
    if(query.paranoid === false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezedAt:{$exists:false}})
    }
})


export const PostModel = models.Post || model<IPost>("Post" , postSchema)
export type HPostDocument = HydratedDocument<IPost>