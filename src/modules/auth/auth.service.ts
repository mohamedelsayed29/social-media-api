import { Request, Response } from "express";
import { ISignupDto } from "./auth.dto";
import { DatabaseRepository } from "../../db/repository/database.repository";
import { IUser, UserModel } from "../../db/models/user.model";
import { BadRequestException } from "../../utils/response/error.responce";

class AuthenticationService{
    private _userModel = new DatabaseRepository<IUser>(UserModel)
    constructor(){}
    signup = async(req:Request,res:Response):Promise<Response>=>{

        let {username,email,password} : ISignupDto = req.body;

        console.log({username,email,password});
        

        const [user] = await this._userModel.create({data:[{username,email,password}], options:{validateBeforeSave:true}}) || []

        if(!user) throw new BadRequestException("Failed to create user")
 
        return res.status(201).json({message:"Signup successful",data: user});
    }


    login = async(req:Request,res:Response):Promise<Response>=>{
        return res.status(200).json({message:"login successful",data: req.body});
    }}
export default new AuthenticationService(); 
