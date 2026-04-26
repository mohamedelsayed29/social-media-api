import { Request, Response } from "express";
import { ISignupDto } from "./auth.dto";
import { UserModel } from "../../db/models/user.model";
import { ConflictException } from "../../utils/response/error.responce";
import { UserRepository } from "../../db/repository/user.repository";
import { generateHash } from "../../utils/security/hash.security";
import { emailEventEmitter } from "../../utils/event/email.event";

class AuthenticationService{
    private _userModel = new UserRepository(UserModel) 
    constructor(){}
    signup = async(req:Request,res:Response):Promise<Response>=>{

        let {
            username,
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
        }: ISignupDto = req.body;
        console.log(req.body);
        
        const checkUser = await this._userModel.findOne({filter:{email},select:"email",options:{lean:true}})
        console.log(checkUser);
        
        if(checkUser) throw new ConflictException("Email already exists")

        const [user] = await this._userModel.create(
            {
                data:[{
                    username,
                    firstName,
                    lastName,
                    email,
                    password : await generateHash(password),
                    phoneNumber,
                }],
                options:{validateBeforeSave:true}
            }) || []
            
            emailEventEmitter.emit("confirmationEmail",{
                to:email,
            })
        return res.status(201).json({message:"Signup successful",data:{user}});
    }


    login = async(req:Request,res:Response):Promise<Response>=>{
        return res.status(200).json({message:"login successful",data: req.body});
    }}
export default new AuthenticationService(); 
