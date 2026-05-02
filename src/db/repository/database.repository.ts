import { CreateOptions, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryFilter, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";

export type Lean<T> = HydratedDocument<FlattenMaps<T>>

export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async create({ data, options }: { data: Partial<TDocument>[]; options?: CreateOptions | undefined }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options)
    }

    async findOne({ filter, select, options }: {
        filter?: QueryFilter<TDocument>,
        select?: ProjectionType<TDocument> | null | undefined,
        options?: QueryOptions<TDocument> | null | undefined
    }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }

    async updateOne({filter,update,options}:{filter:RootFilterQuery<TDocument>,update:UpdateQuery<TDocument>,options?:MongooseUpdateQueryOptions<TDocument> | null | undefined}):Promise<UpdateWriteOpResult>{
        return await this.model.updateOne(filter,{...update,$inc:{__v: 1}},options || {})
    }

    async findById({id, select, options}: {id:string,select?: ProjectionType<TDocument> | null | undefined,options?: QueryOptions<TDocument> | null | undefined}): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null>{
        const doc = this.model.findById(id).select(select || "");
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }
}      