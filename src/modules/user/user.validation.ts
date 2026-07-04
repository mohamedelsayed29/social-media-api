 import {z} from 'zod'
import { Types } from 'mongoose'
import { LogoutEnum } from '../../common'

export const logout = {
    body:z.strictObject({
        flag:z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}

export const freezeAccount = {
    params:z.object({
        userId:z.string().optional()
    }).optional().refine((data) => {
        return data?.userId? Types.ObjectId.isValid(data.userId) : true
    },{error:"Invalid userId",path:["userId"]})
}

export const restoreAccount = {
    params:z.object({
        userId:z.string()
    }).refine(
        (data) => {
        return Types.ObjectId.isValid(data.userId);
    },
    {error:"Invalid userId",path:["userId"]})
}

export const hardDeleteAccount = restoreAccount