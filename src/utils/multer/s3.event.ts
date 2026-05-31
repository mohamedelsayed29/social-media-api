import {EventEmitter} from "node:events"
import { deleteFile, getFile } from "./s3.config"
import { UserModel } from "../../db/models/user.model"
import { UserRepository } from "../../db/repository/user.repository"

export const s3EventEmitter = new EventEmitter({

})

s3EventEmitter.on("trackProfileImageUpload",(data)=>{
    console.log({data})
    setTimeout(async()=>{
        const userModel  = new UserRepository(UserModel)
        try{
            await getFile({key:data.key})

            await userModel.updateOne({
                filter:{_id:data.userId},
                update:{
                    $unset:{tempProfileImage:1},
                }
            })
            await deleteFile({key:data.oldImage})
            
            console.log(`Done`)
        }catch(error:any){
            console.log(error);
            if(error.Code === "NoSuchKey"){
                await userModel.updateOne({
                    filter:{_id:data.userId},
                    update:{
                        profileImage:data.oldkey,
                        $unset:{tempProfileImage:1},
                    }
                })
                console.log(`Profile image upload failed for user ${data.userId} and reverted to old image`)
            }
        }
    },data.expiresIn || Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS) * 1000)
})