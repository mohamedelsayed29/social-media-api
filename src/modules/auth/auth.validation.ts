import z from "zod"
import { generalFields } from "../../middleware/validation.middleware"

export const login = {
    body:z.strictObject({
        email:generalFields.email,
        password:generalFields.password,
    })
}

export const signup = {
    body:login.body.extend({
        username:generalFields.username,
        confirmPassword:generalFields.confirmPassword
    }).superRefine((data,ctx)=>{
        if(data.password !== data.confirmPassword){
            ctx.addIssue({
                code:"custom",
                message:"Passwords do not match",
                path:["confirmPassword"]
            })
        }
    })
    // .refine((data)=>{
    //     return data.password === data.confirmPassword ;
    // },{error:"Passwords do not match",path:["confirmPassword"]})
}