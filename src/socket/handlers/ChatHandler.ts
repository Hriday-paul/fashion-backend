import { Server, Socket } from "socket.io";
import { callbackFn } from "../../utils/CallbackFn";
import { chatService } from "../../modules/chat/chat.service";
import prisma from "../../shared/prisma";

export const getChatList = async (
    userId: string,
    io: Server,
    callback: (arg: any) => void,
    query ?: {}
): Promise<void> => {
    try {

        const user = await prisma.user.findFirst({ where: { id: userId } })

        if (!user) {
            return;
        }

        const chatList = await chatService.getMyChatList(userId, query);
        const myChat = 'chat-list';

        io.to(`user::${userId}`).emit(myChat, chatList);

        callbackFn(callback, { success: true, message: chatList });
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        // socket.emit('io-error', { success: false, message: error.message });
    }
}