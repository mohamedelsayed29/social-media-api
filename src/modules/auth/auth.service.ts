import { Request, Response } from "express";
class AuthenticationService{
    constructor(){}
    signup(req:Request,res:Response):Response{
        return res.status(201).json({message:"Signup successful",data: req.body});
    }
    login(req:Request,res:Response):Response{
        return res.status(200).json({message:"login successful",data: req.body});
    }}
export default new AuthenticationService(); 