import z from 'zod'
import { generalFields } from '../../middleware/validation.middleware'

const parseParticipants = (value:unknown)=>{
    if(Array.isArray(value)) return value
    if(typeof value !== "string") return value
    try{
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : value
    }catch{
        return value.split(",").map((item)=> item.trim()).filter(Boolean)
    }
}

export const getChatSchema = {
    params:z.strictObject({
        userId:generalFields.id,
        
    })
}

export const createGroupSchema = {
    body:z.strictObject({
        group:z.string().trim().min(2).max(60),
        groupDescription:z.string().trim().max(250).optional(),
        participants:z.preprocess(
            parseParticipants,
            z.array(generalFields.id).min(1).max(50)
        ).superRefine((participants, context)=>{
            const uniqueParticipants = new Set(participants)
            if(uniqueParticipants.size !== participants.length){
                context.addIssue({
                    code:"custom",
                    message:"Repeated user id in the same group is not allowed"
                })
            }
        }),
        attachments:generalFields.file(["image/jpeg","image/png","image/jpg"]).optional()
    })
}

export const getGroupSchema = {
    params:z.strictObject({
        groupId:generalFields.id,
    })
}

export const addGroupMembersSchema = {
    params:z.strictObject({
        groupId:generalFields.id,
    }),
    body:z.strictObject({
        participants:z.preprocess(
            parseParticipants,
            z.array(generalFields.id).min(1).max(50)
        ).superRefine((participants, context)=>{
            const uniqueParticipants = new Set(participants)
            if(uniqueParticipants.size !== participants.length){
                context.addIssue({
                    code:"custom",
                    message:"Repeated user id in the same group is not allowed"
                })
            }
        })
    })
}
