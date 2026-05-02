import { Request, Response } from "express";
import { IConfirmEmailDto, ISignupDto } from "./auth.dto";
import { UserModel } from "../../db/models/user.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.responce";
import { UserRepository } from "../../db/repository/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEventEmitter } from "../../utils/event/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";

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
        
        if(checkUser) throw new ConflictException("Email already exists")

        const otp = generateNumberOtp()

        const [user] = await this._userModel.create(
            {
                data:[{ 
                    username,
                    firstName,
                    lastName,
                    email,
                    password : await generateHash(password),
                    phoneNumber,
                    confirmEmailOtp: await generateHash(String(otp))
                }],
                options:{validateBeforeSave:true}
            }) || []
            
            emailEventEmitter.emit("confirmationEmail",{
                to:email,
                otp:otp
            })
        return res.status(201).json({message:"Signup successful",data:{user}});
    }


    login = async(req:Request,res:Response):Promise<Response>=>{
        const {email,password} = req.body;
        const user = await this._userModel.findOne({
            filter:{email},
        })
        if(!user) throw new NotFoundException("User not found")
        if(!user.confirmedAt) throw new BadRequestException("Please confirm your email before logging in")
        if(!await compareHash(password,user.password)) throw new NotFoundException("Invalid login Data")
        const credentials = await createLoginCredentials(user)
        return res.status(200).json({message:"login successful",data:{credentials}});
    }

    confirmEmail = async(req:Request,res:Response):Promise<Response>=>{
        let {
            email,
            otp
        } : IConfirmEmailDto = req.body;
        console.log(email,otp);

        const user = await this._userModel.findOne({
            filter:{
                email,
                confirmEmailOtp:{$exists:true},
                confirmedAt:{$exists:false},
            },
        })
        if(!user) throw new ConflictException("Invalid email or email already confirmed")
        if(!await compareHash(otp,user.confirmEmailOtp as string)) throw new ConflictException("Invalid OTP")
        await this._userModel.updateOne({
            filter:{email},
            update:{
                $set:{confirmedAt:new Date()},
                $unset:{confirmEmailOtp: 1}
            }
        })
        return res.status(200).json({message:"Email confirmed"});
    }
} 
export default new AuthenticationService(); 