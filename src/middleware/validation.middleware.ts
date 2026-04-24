import { NextFunction , Request , Response } from "express"
import { ZodType } from "zod"
import { BadRequestException } from "../utils/response/error.responce"
import { ZodError } from "zod"
import z from "zod"


type KeyReqType = keyof Request
type SchemaType = Partial<Record<KeyReqType, ZodType >>
type ValidationErrorsType = Array<{key: KeyReqType, issues:Array<{message: string, path: string | number | undefined | symbol}>}> 

export const validation = (schema: SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction):NextFunction=>{
        const validationsErrors : ValidationErrorsType = []

        for(const key of Object.keys(schema) as KeyReqType[]){
            if(!schema[key]) continue;
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
    confirmPassword:z.string()
} 