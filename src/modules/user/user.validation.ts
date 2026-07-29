 import {z} from 'zod'
import { Types } from 'mongoose'
import { LogoutEnum } from '../../common'
import { generalFields } from '../../middleware/validation.middleware'

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

export const friendRequestShema = {
    params:z.strictObject({
        userId:generalFields.id
    })
}

export const acceptFriendRequestSchema = {
    params:z.strictObject({
        requestId:generalFields.id
    })
}

export const hardDeleteAccount = restoreAccount

export const updateProfileSchema = {
    body:z.strictObject({
        firstName:generalFields.firstName.optional(),
        lastName:generalFields.lastName.optional(),
        phoneNumber:generalFields.phoneNumber.optional(),
        gender:generalFields.gender,
        address:z.string().min(2).max(120).optional(),
    }).refine((data)=>{
        return Object.values(data).some((value)=> value !== undefined && value !== "")
    },{message:"Please provide at least one field"})
}

export const searchUsersSchema = {
    query:z.strictObject({
        q:z.string().trim().max(80).optional()
    })
}

export const getPublicProfileSchema = {
    params:z.strictObject({
        userId:generalFields.id
    })
}

export const getFriendRequestsSchema = {
    query:z.strictObject({
        type:z.enum(["incoming","outgoing"]).default("incoming")
    })
}

export const rejectFriendRequestSchema = acceptFriendRequestSchema

export const cancelFriendRequestSchema = acceptFriendRequestSchema

export const deleteFriendSchema = {
    params:z.strictObject({
        userId:generalFields.id
    })
}
