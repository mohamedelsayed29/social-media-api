import { HydratedDocument, model, models, Schema } from "mongoose";
import { IComment } from "../../common";

const commentSchema = new Schema<IComment>({
    content:{type:String , minLength:2 , maxLength:50000 , required:function(this:IComment){
        return !this.attachments?.length 
    }},
    attachments:[String],

    tags:[{type:Schema.Types.ObjectId , ref:"User"}],
    likes:[{type:Schema.Types.ObjectId , ref:"User"}],

    postId:{type:Schema.Types.ObjectId , ref:"Post"},
    commentId:{type:Schema.Types.ObjectId , ref:"Comment"},

    freezeedBy:{type:Schema.Types.ObjectId , ref:"User"},
    freezeedAt:{type:Date},
    restoredBy:{type:Schema.Types.ObjectId , ref:"User"},
    restoredAt:{type:Date},
    createdBy:{type:Schema.Types.ObjectId , ref:"User" , required:true},
  
},{timestamps:true , strictQuery:true})


commentSchema.pre(["findOneAndUpdate","updateOne"],async function(next){
    const query = this.getQuery();
    if(query.paranoid === false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezedAt:{$exists:false}})
    }
})

commentSchema.pre(["findOne","find"],async function(next){
    const query = this.getQuery();
    if(query.paranoid === false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezedAt:{$exists:false}})
    }
})


export const CommentModel = models.Comment || model<IComment>("Comment" , commentSchema)
export type HCommentDocument = HydratedDocument<IComment>