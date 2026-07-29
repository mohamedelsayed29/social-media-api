import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatService } from "./chat.service";
import { Server } from "socket.io";


export class ChatEvent{
    constructor(private readonly io:Server, private readonly connectedSocketIds:Map<string,string[]>){}
    private _chatService = new ChatService()
    sayHi = (socket:IAuthSocket)=>{
        return socket.on("sayHi",(message,callback)=>{
            this._chatService.sayHi({message , socket , callback})
        })
    }
    sendMessage = (socket:IAuthSocket)=>{
        return socket.on("sendMessage" ,(data:{content:string , sendTo:string})=>{
            this._chatService.sendMessage({
                ...data,
                socket,
                io:this.io,
                connectedSocketIds:this.connectedSocketIds
            })
        }
    )
    }
    sendGroupMessage = (socket:IAuthSocket)=>{
        return socket.on("sendGroupMessage" ,(data:{content:string , groupId:string})=>{
            this._chatService.sendGroupMessage({
                ...data,
                socket,
                io:this.io,
                connectedSocketIds:this.connectedSocketIds
            })
        })
    }
}
