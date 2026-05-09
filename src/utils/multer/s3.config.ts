import { v4 as uuid } from "uuid"
import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { StorageEnum } from "./cloud.multer"
import { createReadStream } from "node:fs"
import { BadRequestException } from "../response/error.responce"

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
    Bucket = process.env.AWS_BUCKET_NAME,
    ACL = "private",
    Path = "general",
    file,
    storageApproach = StorageEnum.memory
}: { Bucket?: string, ACL?: ObjectCannedACL, Path?: string, file: Express.Multer.File, storageApproach?: StorageEnum }): Promise<string> => {
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
