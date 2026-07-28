import { DatabaseRepository } from "./database.repository";
import {IChat as TDocument} from "../../common/interface/chat.interface"
import { Model } from "mongoose";


export class ChatRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model)
    }
}
