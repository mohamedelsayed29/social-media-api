import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as TDocument  } from "../models/user.model";
import { DatabaseRepository } from "./database.repository";
import { BadRequestException } from "../../utils/response/error.responce";

export class UserRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model:Model<TDocument>){
        super(model);
    }

    async createUser({data, options}:{data:Partial<TDocument>[],options?: CreateOptions}):Promise<HydratedDocument<TDocument>>{
        const [user] = await this.create({data,options}) || [];
        if(!user) throw new BadRequestException("Failed to create user");
        return user;
    }
  
} 