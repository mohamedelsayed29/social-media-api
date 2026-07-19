import { DatabaseRepository } from "./database.repository";
import {IFriendRequest as TDocument} from "../../common/interface/friendRequest.interface"
import { Model } from "mongoose";


export class FriendRequestRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model)
    }
     
}
