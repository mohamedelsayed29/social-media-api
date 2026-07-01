import { NextFunction , Request , Response } from "express"
import { ZodType } from "zod"
import { BadRequestException } from "../utils/response/error.responce"
import { ZodError } from "zod"
import z from "zod"
import { Types } from "mongoose"

type KeyReqType = keyof Request
type SchemaType = Partial<Record<KeyReqType, ZodType >>
type ValidationErrorsType = Array<{key: KeyReqType, issues:Array<{message: string, path: string | number | undefined | symbol}>}> 

export const validation = (schema: SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction):NextFunction=>{
        const validationsErrors : ValidationErrorsType = []

        for(const key of Object.keys(schema) as KeyReqType[]){
            if(!schema[key]) continue;
            if(req.file){
                req.body.attachments = req.file;
            }
            if(req.files){                
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);   

            if(!validationResult?.success){
                const errors = validationResult.error as unknown as ZodError
                validationsErrors.push({key,issues: errors.issues.map((issues)=>{
                    return{ message:issues.message , path:issues.path[0]}
                })
            })
        }
    }
        if(validationsErrors.length){
            throw new BadRequestException("Validation Failed",{cause:validationsErrors})
        }
        return next() as unknown as NextFunction;
    }
}

export const generalFields ={
    username:z.string().min(3).max(20),
    email:z.email(),
    password:z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/),
    confirmPassword:z.string(),
    firstName:z.string().min(2).max(25),
    lastName:z.string().min(2).max(25), 
    phoneNumber:z.string().regex(/^\+?[1-9]\d{1,14}$/),
    otp:z.string().regex(/^\d{6}$/),
    gender: z.preprocess((val)=>{
        if(typeof val === "string") return val.trim().toLowerCase();
        return val;
    }, z.enum(["male", "female", "other"]).optional()),
    file: function(mimetype:string[]){
        return z.strictObject({
                fieldname: z.string(),
                originalname: z.string(),
                encoding: z.string(),
                mimetype: z.string(),
                buffer: z.any().optional(),
                path:z.string().optional(),
                size:z.number(),
                destination: z.string().optional(),
        filename: z.string().optional(),
            }).refine((data)=>{
                return data.path || data.buffer
        },{error:"Please Provide a file"})
    },
    id:z.string().refine((data)=>{
        return Types.ObjectId.isValid(data)
    },{error:"Invalid Tag id"})
} 