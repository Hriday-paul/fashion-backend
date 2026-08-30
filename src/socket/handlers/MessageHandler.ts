import { Server, Socket } from "socket.io";
import { callbackFn } from "../../utils/CallbackFn";
import prisma from "../../shared/prisma";
import { Message } from "../../../generated/prisma/client";
import httpStatus from "http-status"
import { messagesService } from "../../modules/messages/messages.service";
import { getChatList } from "./ChatHandler";
import { chatService } from "../../modules/chat/chat.service";
import { paginationHelper } from "../../helper/pagination.helper";

export const MessageHandler = async (
    userId: string,
    payload: { chatId?: string, itemIds: string[], friendId: string },
    io: Server,
    socket: Socket,
    callback: (arg: any) => void,
): Promise<void> => {
    // try {

    //     const { chatId: pChatId, itemIds, friendId } = payload;

    //     let chatId = pChatId;

    //     if (!pChatId && !itemIds?.length) {
    //         callbackFn(callback, {
    //             success: false,
    //             message: 'chatId or itemIds is missing',
    //         });
    //         socket.emit('io-error', {
    //             success: false,
    //             message: 'chatId or itemIds is missing',
    //         });

    //         return;
    //     }

    //     if (!pChatId) {
    //         const chat = await chatService.getChatByItemIds(userId, friendId, itemIds);

    //         if (chat) {
    //             chatId = chat?.id;
    //         }
    //     }

    //     const getPreMessage = !chatId ?
    //         {
    //             data: [],
    //             meta: paginationHelper.generatePaginationMeta({ page: 1, limit: 25, total: 0 })
    //         }
    //         :
    //         await messagesService.getAllPreMessages(chatId, { page: 1, limit: 25 });

    //     const roomKeyByProdIds = itemIds?.length ? 'chat::' + itemIds?.sort().join('::') : null;

    //     if (chatId) {
    //         socket.join(`chat::${chatId}`);
    //     } else {
    //         if (roomKeyByProdIds) {
    //             socket.join(roomKeyByProdIds);
    //         }
    //     }

    //     //end Notification//
    // } catch (error: any) {
    //     callbackFn(callback, {
    //         success: false,
    //         message: error.message,
    //     });
    //     socket.emit('io-error', { success: false, message: error });
    //     console.error('Error in message-page event:', error);
    // }
}

export const SendMessageHandle = async (
    io: Server,
    payload: Message & { receiverUserName: string },
    callback: (arg: any) => void
) => {
    try {

        const reciverRoom = `user::${payload?.receiverId}`;
        const senderRoom = `user::${payload?.senderId}`;

        io.to(reciverRoom).emit(`new-message::${payload?.senderId}`, payload);
        io.to(senderRoom).emit(`new-message::${payload?.receiverUserName}`, payload);

        //---------------hit on chatlist for see last sent message with the chatList------------------//
        getChatList(payload?.senderId, io, callback)
        getChatList(payload?.receiverId, io, callback)

        //end Notification//
        callbackFn(callback, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Message sent successfully!',
            data: payload,
        });
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        // socket.emit('io-error', { success: false, message: error });
        console.error('Error in send message event:', error);
    }
}

export const MsgSeenHandle = async (
    io: Server,
    socket: Socket,
    payload: { chatId: string },
    userId: string,
    callback: (arg: any) => void
) => {
    try {
        const { chatId } = payload;

        if (!chatId) {
            callbackFn(callback, {
                success: false,
                message: 'chatId id is required',
            });
            socket.emit('io-error', {
                success: false,
                message: 'chatId id is required',
            });
            return;
        }

        const chat = await prisma.chat.findFirst({ where: { id: chatId } })

        if (!chat) {
            callbackFn(callback, {
                success: false,
                message: 'chat id is not valid',
            });
            socket.emit('io-error', {
                success: false,
                message: 'chat id is not valid',
            });
            return;
        }

        //--------update message seen---------
        await messagesService.seenMessage(userId, chatId)

        const user1Id = chat.user1Id
        const user2Id = chat.user2Id;

        //---------------hit on chatlist for see unread message count with the chatList------------------//
        getChatList(user1Id, io, callback)
        getChatList(user2Id, io, callback)

        // const getPreMessage = await prisma.message.findMany({
        //     where: {
        //         OR: [
        //             { senderId: user1?.id, receiverId: user2?.id },
        //             { senderId: user2?.id, receiverId: user1?.id },
        //         ]
        //     },
        //     include: { files: true },
        //     orderBy: {
        //         createdAt: "asc"
        //     }
        // })

        // socket.emit('message', getPreMessage || []);

    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        socket.emit('io-error', { success: false, message: error });
        console.error('Error in message-page event:', error);
    }
}

export const MsgTyping = async (
    socket: Socket,
    io: Server,
    payload: Message,
    callback: (arg: any) => void,
    user_name: string
) => {
    try {
        const { receiverId } = payload;

        if (!payload?.receiverId) {
            callbackFn(callback, {
                success: false,
                message: 'receiverId is required',
            });
            socket.emit('io-error', {
                success: false,
                message: 'receiverId id is required',
            });
            return;
        }

        const chat = 'typing::' + receiverId;
        const message = user_name + ' is typing...';
        io.to(`user::${receiverId}`).emit(chat, { message: message });
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        console.error('Error in seen event:', error);
        // socket.emit('error', { message: error.message });
    }
}

export const MsgStopTyping = async (
    socket: Socket,
    io: Server,
    payload: Message,
    callback: (arg: any) => void,
    user_name: string
) => {
    try {
        const { receiverId } = payload;

        if (!receiverId) {
            callbackFn(callback, {
                success: false,
                message: 'receiverId is required',
            });
            socket.emit('io-error', {
                success: false,
                message: 'receiverId id is required',
            });
            return;
        }

        const chat = 'stopTyping::' + receiverId;
        const message = user_name + ' is stop typing...';
        io.to(`user::${receiverId}`).emit(chat, { message: message });

    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        console.error('Error in seen event:', error);
        // socket.emit('error', { message: error.message });
    }
}