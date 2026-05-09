import multer, { FileFilterCallback } from "multer";
import {v4 as uuid} from 'uuid'
import { Request } from "express";
import { BadRequestException } from "../response/error.responce";

export enum StorageEnum {
    memory = "memory",
    disk = "disk"
}

export const fileValidation = {
    images:['image/jpeg','image/png','image/jpg'],
    pdf:["application/pdf"],
}


export const cloudFileUpload =  ({
    validation = [],
    storageApproach = StorageEnum.memory,
    maxSize = 2
    }:{
        validation?:string[],
        storageApproach?:StorageEnum,
        maxSize?:number
    }):multer.Multer=>{
    const storage = storageApproach === StorageEnum.memory
        ? multer.memoryStorage() 
        : multer.diskStorage({filename(req:Request, file:Express.Multer.File, callback) {
        return callback(null,`${uuid()}-${file.originalname}`)
    },})
    function fileFilter(req:Request, file:Express.Multer.File, callback : FileFilterCallback){
        if(!validation.includes(file.mimetype)) return callback(new BadRequestException("Invalid File Type"))
        
        return callback(null,true)
    }

    return multer({fileFilter,limits:{fileSize:maxSize*1024*1024},storage})
} 