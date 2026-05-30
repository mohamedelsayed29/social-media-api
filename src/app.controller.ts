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
import { createGetPresignedUrl, deleteFile, deleteFiles, getFile } from './utils/multer/s3.config'
import { promisify } from 'node:util'
import { pipeline } from 'stream'
const createS3WriteStream = promisify(pipeline)
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
    //get asset
    app.get('/upload/*path',async (req:Request,res:Response)=>{
        const {downloadName} = req.query as unknown as {downloadName:string}
        const {path} = req.params as unknown as {path:string[]}
        const key = path.join('/')
        const s3Response = await getFile({key})
        if(!s3Response?.Body){
            throw new NotFoundException("File not found")
        }

        if(downloadName){
            res.setHeader(
                'Content-Disposition', 
                `attachment; filename="${downloadName}"`
            );
        }
        res.setHeader(
            'Content-Type', 
            `${s3Response.ContentType}`|| 'application/octet-stream'
        );
        return await createS3WriteStream(s3Response.Body as NodeJS.ReadableStream, res)
    })
    //get asset Presigned URL
    app.get('/upload/presigned-url/*path',async (req:Request,res:Response)=>{
        const {downloadName , download} = req.query as unknown as {downloadName?:string, download?:boolean}
        const {path} = req.params as unknown as {path:string[]}
        const key = path.join('/')
        const url = await createGetPresignedUrl({key , downloadName:downloadName as string, download:download as boolean})
        return res.status(200).json({message:"Presigned URL generated successfully",data:{url}})
    })
    // delete one asset
    app.get('/delete-s3',async (req:Request,res:Response)=>{
        const {key} = req.query as unknown as {key:string}
        const response = await deleteFile({key : key as string})
        return res.status(200).json({message:"File deleted successfully",data:{response}})
    })
    // delete multiple assets
    app.get('/delete-s3-multiple',async (req:Request,res:Response)=>{
        const {urls} = req.query as unknown as {urls:string[]}
        const response = await deleteFiles({urls})
        return res.status(200).json({message:"Files deleted successfully",data:{response}})
    })
    // list directory
    app.get('/list-directory/*path',async (req:Request,res:Response)=>{

    app.listen(port,()=>{
        console.log(`server is running on port ${port}`);
    })

    app.use(globalErrorHandler)

    await connectDB()
}
export default bootstrap;  