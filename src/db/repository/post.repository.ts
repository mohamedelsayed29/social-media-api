import { DatabaseRepository, Lean } from "./database.repository";
import {IPost as TDocument} from "../../common/interface/post.interface"
import { HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions , RootFilterQuery} from "mongoose";
import { CommentRepository } from "./comment.repository";
import { CommentModel } from "../models/comment.model";


export class PostRepository extends DatabaseRepository<TDocument>{
    private _commentModel = new CommentRepository(CommentModel)
    
    constructor(protected override readonly model:Model<TDocument>){
        super(model )
    }

        async findCursor({ filter, select, options }: {
            filter?: RootFilterQuery<TDocument>,
            select?: ProjectionType<TDocument> | undefined,
            options?: QueryOptions<TDocument> | undefined
        }): Promise<HydratedDocument<TDocument>[] | [] | Lean<TDocument>[]> {
            let results: any[] = [] as HydratedDocument<TDocument>[] | [] | Lean<TDocument>[];
            const cursor = this.model.find(filter || { }).select(select || "").populate(options?.populate as PopulateOptions[]).cursor();
            for(let doc = await cursor.next(); doc != null; doc = await cursor.next()){

                const comment = await this._commentModel.find({
                    filter:{
                        postId:doc._id,
                        commentId:{$exists:false},
                    }
                    })
                    results.push({
                        post:doc.toObject(),
                        comments:comment
                    })

            }
            return results;
        }
     
}
