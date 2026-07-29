import { Server } from "socket.io";

type ConnectedSocketMap = Map<string, string[]>;

let ioServer: Server | null = null;
let connectedSocketIds: ConnectedSocketMap | null = null;

export const setNotificationRealtimeBridge = (io: Server, sockets: ConnectedSocketMap) => {
    ioServer = io;
    connectedSocketIds = sockets;
};

export const emitNotification = ({recipientId, notification}: {recipientId:string, notification:unknown})=>{
    if(!ioServer || !connectedSocketIds) return;
    const socketIds = connectedSocketIds.get(recipientId) || [];
    for (const socketId of socketIds) {
        ioServer.to(socketId).emit("notification", {notification});
    }
}
