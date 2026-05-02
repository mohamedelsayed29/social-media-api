import express from 'express'
import type {Express, Request, Response} from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import {resolve} from 'node:path'
import { config } from 'dotenv'
import authRouter from'./modules/auth/auth.controller'
import userRouter from './modules/user/user.controller'
import { globalErrorHandler, NotFoundException } from './utils/response/error.responce'
import connectDB from './db/connection.db'

config({path:resolve("./config/.env.development")})


const limiter = rateLimit({
    windowMs:60 * 60000,
    limit:2000,
    message:{error:"Too many requests from this IP, please try again after an hour"},
    statusCode:429,
})


const bootstrap = async ():Promise<void>=>{
    const app : Express  =  express()
    const port : number | string = process.env.PORT || 5000
    
    app.use(express.json(), helmet() , cors())
    app.use(limiter)


    app.get('/',(req : Request , res:Response)=>{
        res.json({message:"Welcome to the Social App"})
    }) 
    app.use("/api/auth", authRouter)
    app.use("/api/users", userRouter)
    app.all('{/*dummy}',(req:Request,res:Response)=>{
        throw new NotFoundException("Route not found")
    })

    app.listen(port,()=>{
        console.log(`server is running on port ${port}`);
    })

    app.use(globalErrorHandler)

    await connectDB()
}
export default bootstrap;  