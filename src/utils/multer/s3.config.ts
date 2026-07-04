import { v4 as uuid } from "uuid"
import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { createReadStream } from "node:fs"
import { BadRequestException } from "../response/error.responce"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { StorageEnum } from "../../common"

export const s3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string
        }
    })
}

export const uploadfile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    Path = "general",
    file,
    storageApproach = StorageEnum.disk
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    Path?: string,
    file: Express.Multer.File,
    storageApproach?: StorageEnum
}): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${Path}/${uuid()}_${file.originalname}`,
        Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype
    });

    await s3Config().send(command)
    if (!command?.input?.Key) {
        throw new BadRequestException("fail to generate upload key")
    }
    return command.input.Key
}

export const uploadLargeFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    Path = "general",
    file,
    storageApproach = StorageEnum.disk
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    Path?: string,
    file: Express.Multer.File,
    storageApproach?: StorageEnum
}): Promise<string> => {
    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${Path}/${uuid()}_${file.originalname}`,
            Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype
        },
        partSize: 500 * 1024 * 1024, // 500MB
    });

    upload.on("httpUploadProgress", (progress) => {
        console.log(`Upload Progress: ${progress.loaded} / ${progress.total}`);
    });

    const { Key } = await upload.done();
    if (!Key) {
        throw new BadRequestException("fail to generate upload key")
    }
    return Key
}

export const uploadFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    Path = "general",
    files,
    useLarge = false,
    storageApproach = StorageEnum.disk

}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    Path?: string,
    files: Express.Multer.File[],
    storageApproach?: StorageEnum
    useLarge?:boolean
}): Promise<string[]> => {

    let urls: string[] = []
    if(useLarge){
        urls = await Promise.all(
            files.map(async (file) => {
                return await uploadLargeFile({Bucket,ACL,Path,file})
            })
        )
    }else{
        urls = await Promise.all(
            files.map(async (file) => {
                return await uploadfile({Bucket,ACL,Path,file})
            })
        )
    }
    return urls
}

export const createPresignedUrl = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Path = "general",
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS),
    contentType,
    originalname
}:{
    Bucket?:string,
    Path?:string,
    contentType:string
    originalname:string
    expiresIn?:number
}):Promise<{url:string,key:string}>=>{
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        ACL:"private",
        Key: `${process.env.APPLICATION_NAME}/${Path}/${uuid()}_${originalname}`,
        ContentType:"application/octet-stream"
    })
    const url = await getSignedUrl(s3Config(),command,{expiresIn})
    if(!url || !command?.input?.Key){
        throw new BadRequestException("fail to generate presigned url")
    }
    return {url,key:command.input.Key as string}
}

export const createGetPresignedUrl = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    key,
    downloadName="dummy",
    download = false,
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS)
}:{
    Bucket?:string,
    key:string,
    downloadName?:string,
    download?:boolean,
    expiresIn?:number
})=>{
    const command = new GetObjectCommand({
        Bucket,
        Key:key,
        ResponseContentDisposition: download === true ? `attachment; filename="${downloadName}"`: undefined
    })
    const url = await getSignedUrl(s3Config(),command,{expiresIn})
    if(!url){
        throw new BadRequestException("fail to generate presigned url")
    }
    return url
}

export const getFile = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    key
}:{
    Bucket?:string,
    key:string
}):Promise<GetObjectCommandOutput>=>{
    const command = new GetObjectCommand({Bucket,Key:key})

    return await s3Config().send(command)

}

export const deleteFile = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    key
}:{
    Bucket?:string,
    key:string
}):Promise<DeleteObjectCommandOutput>=>{
    const command = new DeleteObjectCommand({Bucket,Key:key})

    return await s3Config().send(command)

}

export const deleteFiles = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet = false
}:{
    Bucket?:string,
    urls:string[],
    Quiet?:boolean
}):Promise<DeleteObjectCommandOutput>=>{
    const Objects = urls.map((url) => {
        return {Key:url}
    })
    const command = new DeleteObjectsCommand({Bucket,Delete:{Objects, Quiet}})

    return await s3Config().send(command)

}

export const listDirectory = async({Bucket=process.env.AWS_BUCKET_NAME as string,path}:{Bucket?:string,path:string})=>{
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`
    })

    return await s3Config().send(command)
}

export const deleteFolderByPrefix = async({Bucket=process.env.AWS_BUCKET_NAME as string,path,Quiet=false}:{Bucket?:string,path:string,Quiet?:boolean}):Promise<DeleteObjectCommandOutput>=>{
    const fileList = await listDirectory({Bucket,path})
    if(!fileList?.Contents?.length){
        throw new BadRequestException("Directory is empty or not found")
    }
    const urls:string[] = fileList.Contents.map((file) => {
        return file.Key as string
    })
    return await deleteFiles({urls,Bucket,Quiet})
}