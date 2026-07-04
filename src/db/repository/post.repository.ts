import { DatabaseRepository } from "./database.repository";
import {IPost as TDocument} from "../../common/interface/post.interface"
import { Model } from "mongoose";


export class PostRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model )
    }
     
}
