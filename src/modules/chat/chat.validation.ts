import z from 'zod'
import { generalFields } from '../../middleware/validation.middleware'

export const getChatSchema = {
    params:z.strictObject({
        userId:generalFields.id,
        
    })
}