import { IAuthSocket } from "../gateway/gateway.dto";
import { ChatEvent } from "./chat.events";
import { Server } from "socket.io";


export class ChatGateway {
    private _chatEvent:ChatEvent
    constructor(io:Server, connectedSocketIds:Map<string,string[]>){
        this._chatEvent = new ChatEvent(io, connectedSocketIds)
    }
    register = (socket:IAuthSocket)=>{
        this._chatEvent.sayHi(socket)
        this._chatEvent.sendMessage(socket)
        this._chatEvent.sendGroupMessage(socket)
    }
}
