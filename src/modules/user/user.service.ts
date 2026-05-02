import { Response,NextFunction, Request } from "express";
 
export class UserService {
    constructor(){}

    profile = async(req:Request,res:Response,next:NextFunction):Promise<Response> => {
        return res.json({message:"Done",data:{user:req.user,decoded:req.decoded}})
    }
}

export default new UserService();