import { CreateOptions, FlattenMaps, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryFilter, QueryOptions } from "mongoose";

export type Lean<T> = HydratedDocument<FlattenMaps<T>>

export abstract  class DatabaseRepository<TDocument>{
    constructor(protected readonly model:Model<TDocument>){}

    async create({data,options}:{data:Partial<TDocument>[];options?:CreateOptions | undefined}):Promise<HydratedDocument<TDocument>[]| undefined>{
        return await this.model.create(data,options)
    }

    async findOne({filter , select , options}:{
      filter?: QueryFilter<TDocument>, 
      select?: ProjectionType<TDocument> | null | undefined,
      options?: QueryOptions<TDocument>  | null | undefined
    }):Promise<Lean<TDocument>|HydratedDocument<TDocument> | null>{
        const doc = this.model.findOne(filter).select(select || "");
        if(options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if(options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }
}      