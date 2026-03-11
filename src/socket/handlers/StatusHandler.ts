import { Server, Socket } from "socket.io";
import { addUserOnline, removeUserOffline } from "../utils/OnlineUser";
import prisma from "../../shared/prisma";
import { Role } from "../../../generated/prisma/enums";
import { callbackFn } from "../../utils/CallbackFn";

export const handleUserOnline = async (
    userId: string,
    role: string,
    io: Server,
    socket: Socket,
    callback: (arg: any) => void
): Promise<void> => {
    try {
        addUserOnline(userId?.toString(), socket.id);

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: true
            }
        })

        // ---------------online driver -------------
        // getOnlineDrivers(userId, role, io, socket, callback);

    } catch (error) {
        console.error("Error handling user online:", error);
    }
}

export const getOnlineDrivers = async (
    userId: string,
    role: string,
    io: Server,
    socket: Socket,
    callback: (arg: any) => void,
) => {
    try {

        if (role != Role.ADMIN) {
            return;
        }

        const onlineDrivers = await prisma.user.findMany({
            where: {
                auth: {
                    // role: Role.Driver,
                },
                isOnline: true
            }
        })

        // sent online drivers
        io.to(`user::${userId}`).emit("online-drivers", onlineDrivers)

    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        socket.emit('io-error', { success: false, message: error });
        console.error('Error in message-page event:', error);
    }
}

export const handleUserOffline = async (
    userId: string,
    role: string,
    io: Server,
    socket: Socket,
    callback: (arg: any) => void
): Promise<void> => {

    try {
        const isCompletelyOffline = removeUserOffline(userId?.toString(), socket.id);

        if (isCompletelyOffline) {
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    isOnline: false
                }
            })

            // ---------------online driver -------------
            getOnlineDrivers(userId, role, io, socket, callback);

        }
    } catch (error) {
        console.error("Error handling user offline:", error);
    }
};