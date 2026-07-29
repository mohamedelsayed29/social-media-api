import { Server as httpServer } from "node:http";
import { Server } from "socket.io";
import { decodeToken } from "../../utils/security/token.security";
import { TokenTypeEnum } from "../../common";
import { IAuthSocket } from "./gateway.dto";
import { ChatGateway } from "../chat/chat.gateway";
import { setPostRealtimeBridge } from "../post/post.realtime";
import { setNotificationRealtimeBridge } from "../notification/notification.realtime";



export const initialize = (httpServer:httpServer)=>{ 
 
    const connectedSocketIds = new Map<string, string[]>()

    const io = new Server(httpServer,{
        cors:{
            origin:"*"
        }
    });

    // middlware
    io.use(async(socket:IAuthSocket,next)=>{
        try{
            const {user , decoded} = 
            await decodeToken({authorization:socket.handshake?.auth.authorization || " ",
                tokenType:TokenTypeEnum.access
            })
            const userTabs = connectedSocketIds.get(user._id.toString()) || []
            // console.log({user , token});
            userTabs.push(socket.id)

            connectedSocketIds.set(user._id.toString(),userTabs)
            console.log("connectedSocketIds",connectedSocketIds);
            socket.credentials = {user,decoded}
            next()
        }catch{
            next(new Error("Authentication failed"))
        }
    })

    // connection

    function disconnection(socket:IAuthSocket){
        socket.on("disconnect",()=>{
            const userId = socket.credentials?.user._id?.toString() as string
            let remainingTabs = connectedSocketIds.get(userId)?.filter((tab)=>{
                return tab !== socket.id 
            }) || []
            if(remainingTabs.length){
                connectedSocketIds.set(userId , remainingTabs)
            }else{
                connectedSocketIds.delete(userId)
            }
            console.log(`After Delete » » » ::: ${connectedSocketIds.get(userId)}`);
            console.log(connectedSocketIds);
            
        })
    }
    
    const chatGateway:ChatGateway = new ChatGateway(io, connectedSocketIds)
    setPostRealtimeBridge(io, connectedSocketIds)
    setNotificationRealtimeBridge(io, connectedSocketIds)
    io.on("connection",(socket:IAuthSocket)=>{

        console.log(connectedSocketIds);
        chatGateway.register(socket)
        console.log("User connected",socket.id );
        disconnection(socket)
    })
    //    connectedSocketIds.delete(socket.credentials?.user._id?.toString() as string,socket.id)



    // multiplexing socket.io Namespace
    //    io.of("/namespace").on("connection",(socket:Socket)=>{
    //     console.log("Admin connected",socket.id );

    //     socket.on("disconnect",()=>{
    //         console.log(`logout from ::: ${socket.id}`);
            
    //     })
    // }) 
}
