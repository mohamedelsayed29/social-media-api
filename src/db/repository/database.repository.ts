import { CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, Types, UpdateQuery, UpdateWriteOpResult } from "mongoose";
export type Lean<T> = HydratedDocument<FlattenMaps<T>>
type RepositoryFilter = Record<string, any>

export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async create({ data, options }: { data: Partial<TDocument>[]; options?: CreateOptions | undefined }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data as any, options)
    }
    
    async insertMany({ data }: { data: Partial<TDocument>[]; options?: CreateOptions | undefined }): Promise<HydratedDocument<TDocument>[]> {
        return await this.model.insertMany(data) as HydratedDocument<TDocument>[]
    }

    async findOneAndUpdate({ filter, update, options }: {
        filter: RepositoryFilter,
        update : UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument> | null | undefined
    }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {  
        const doc = this.model.findOneAndUpdate(filter, update, options || {})
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }

    async find({ filter, select, options }: {
        filter?: RepositoryFilter,
        select?: ProjectionType<TDocument> | undefined,
        options?: QueryOptions<TDocument> | undefined
    }): Promise<HydratedDocument<TDocument>[]> {
        const doc = this.model.find(filter || { }).select(select || "");
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        if(options?.limit) doc.limit(options.limit)
        if(options?.skip) doc.skip(options.skip)
        return await doc.exec();
    }

    async paginate({ filter = {}, select = {}, options = {} , size = 5 , page = 1 }: {
        filter?: RepositoryFilter,
        select?: ProjectionType<TDocument>  | undefined,
        options?: QueryOptions<TDocument>  | undefined,
        size?: number,
        page?: number
    }){
        let docsCount: number | undefined = undefined;
        let pagesCount: number | undefined = undefined;
       page = Math.floor(page < 1 ? 1 : page);
       options.limit = Math.floor(size < 1 || !size  ? 5 : size);
       options.skip = (page - 1) * options.limit;
       pagesCount = Math.ceil(await this.model.countDocuments(filter) / options.limit);
       docsCount = await this.model.countDocuments(filter);
       const results =  await this.find({filter,select,options})
       return { results, docsCount, pagesCount , currentPage: page, pageSize: options.limit }
    }

    async findOne({ filter, select, options }: {
        filter?: RepositoryFilter,
        select?: ProjectionType<TDocument> | null | undefined,
        options?: QueryOptions<TDocument> | null | undefined
    }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(filter , select , options ).select(select || "");
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }

    async updateOne({ filter, update, options }: { filter: RepositoryFilter, update: UpdateQuery<TDocument>, options?: MongooseUpdateQueryOptions<TDocument> | null | undefined }): Promise<UpdateWriteOpResult> {
        // Ensure `updatePipeline` is a strict boolean to satisfy Mongoose typings
        const { updatePipeline: _updatePipeline, ...restOptions } = options || {};
        const updateOptions = {
            ...(restOptions as any),
            updatePipeline: Array.isArray(update) ? true : Boolean(_updatePipeline),
        } as unknown as MongooseUpdateQueryOptions<TDocument>;

        if (Array.isArray(update)) {
            // append version increment stage for pipeline updates
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] }
                }
            });
            return await this.model.updateOne(filter, update as any, updateOptions);
        }

        return await this.model.updateOne(filter, { ...(update as any), $inc: { __v: 1 } }, updateOptions);
    }

    async deleteOne({ filter }: { filter: RepositoryFilter}): Promise<DeleteResult> {
        return await this.model.deleteOne(filter)
    }

    async deleteMany({ filter }: { filter: RepositoryFilter }): Promise<DeleteResult> {
        return await this.model.deleteMany(filter)
    }

    async findOneAndDelete({ filter }: { filter: RepositoryFilter }): Promise<HydratedDocument<TDocument>|null> {
        return await this.model.findOneAndDelete (filter)
    }

    async findByIdAndUpdate({ id, update, options }: { id: string, update: UpdateQuery<TDocument>, options?: QueryOptions<TDocument> | null | undefined }): Promise<HydratedDocument<TDocument> |Lean<TDocument> | null> {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options || { new: true })
    }

    async findById({ id, select, options }: { id:Types.ObjectId, select?: ProjectionType<TDocument> | null | undefined, options?: QueryOptions<TDocument> | null | undefined }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findById(id).select(select || "");
        if (options?.populate) doc.populate(options.populate as PopulateOptions[]);
        if (options?.lean) doc.lean(options.lean);
        return await doc.exec();
    }
}
