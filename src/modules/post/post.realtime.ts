import { Server } from "socket.io";

type ConnectedSocketMap = Map<string, string[]>;

let ioServer: Server | null = null;
let connectedSocketIds: ConnectedSocketMap | null = null;

export const setPostRealtimeBridge = (io: Server, sockets: ConnectedSocketMap) => {
    ioServer = io;
    connectedSocketIds = sockets;
};

export const emitPostCreated = ({
    post,
    recipientIds,
}: {
    post: unknown;
    recipientIds: "all" | string[];
}) => {
    if(!ioServer || !connectedSocketIds) return;

    if(recipientIds === "all"){
        ioServer.emit("postCreated", {post});
        return;
    }

    const uniqueRecipientIds = new Set(recipientIds);
    for (const userId of uniqueRecipientIds) {
        const socketIds = connectedSocketIds.get(userId) || [];
        for (const socketId of socketIds) {
            ioServer.to(socketId).emit("postCreated", {post});
        }
    }
};
