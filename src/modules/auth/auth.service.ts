import { Request, Response } from "express";
import { IConfirmEmailDto, IGmailDto, ISignupDto } from "./auth.dto";
import { ProviderEnum, UserModel } from "../../db/models/user.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.responce";
import { UserRepository } from "../../db/repository/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEventEmitter } from "../../utils/event/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";
import { OAuth2Client, type TokenPayload } from 'google-auth-library' ;


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
            filter:{email,provider:ProviderEnum.system},
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
    private async verfiyGmailAccount (idToken:string):Promise<TokenPayload>{
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [] , 
        }); 
        const payload = ticket.getPayload();
        if(!payload?.email_verified) throw new BadRequestException("Fail to verify this google account")
        
        return payload

    }

    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const {idToken}:IGmailDto = req.body
        const {email , family_name , given_name , name , picture } = await this.verfiyGmailAccount(idToken)
        const user = await this._userModel.findOne({
            filter:{email:email as string},
        })
        if(user){
            if(user.provider === ProviderEnum.google){
                return await this.loginWithGmail(req,res)
            }
            throw new ConflictException(`Emain exist with another Provider ::: ${user.provider}`)
        }
        const [newUser] = await this._userModel.create({
            data:[{
                email:email as string,
                firstName:given_name as string, 
                lastName:family_name as string,
                username:name as string,
                profileImage:picture as string,
                provider:ProviderEnum.google,
                confirmedAt:new Date()
            }]
        }) || [] 

        if(!newUser) throw new BadRequestException("Fail to signup with gmail please try agin later")
        
        const credentials = await createLoginCredentials(newUser)
        return res.status(201).json({ message: "Account Created Successfuly" , data:{credentials}})
    }

    loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const {idToken}:IGmailDto = req.body
        const {email} = await this.verfiyGmailAccount(idToken)
        const user = await this._userModel.findOne({
            filter:{email:email as string , provider:ProviderEnum.google},
        })

        if(!user) throw new NotFoundException(`Not Registered Account or Registered with another Provider`)
        
        const credentials = await createLoginCredentials(user)
        return res.status(200).json({ message: "Account Created Successfuly" , data:{credentials}})
    }
} 
export default new AuthenticationService();