import { Server, Socket } from "socket.io";
import { callbackFn } from "../../utils/CallbackFn";
import { chatService } from "../../modules/chat/chat.service";
import { Role } from "../../../generated/prisma/enums";
import prisma from "../../shared/prisma";

export const getChatList = async (
    userId: string,
    io: Server,
    socket: Socket,
    callback: (arg: any) => void,
    query ?: {}
): Promise<void> => {
    try {

        const user = await prisma.user.findFirst({ where: { id: userId }, select: { auth: { select: { role: true } } } })

        if (!user || !user?.auth) {
            return;
        }

        const chatList = await chatService.getMyChatList(userId, user?.auth?.role, query);
        const myChat = 'chat-list';

        io.to(`user::${userId}`).emit(myChat, chatList);

        callbackFn(callback, { success: true, message: chatList });
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        socket.emit('io-error', { success: false, message: error.message });
    }
}