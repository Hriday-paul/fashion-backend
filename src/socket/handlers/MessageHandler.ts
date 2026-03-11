import { Server, Socket } from "socket.io";
import { callbackFn } from "../../utils/CallbackFn";
import prisma from "../../shared/prisma";
import { Message, Role, User } from "../../../generated/prisma/client";
import httpStatus from "http-status"
import { messagesService } from "../../modules/messages/messages.service";
import { getChatList } from "./ChatHandler";

export const MessageHandler = async (
    userId: string,
    friendId: string,
    io: Server,
    socket: Socket,
    callback: (arg: any) => void,
): Promise<void> => {
    try {

        if (!friendId) {
            callbackFn(callback, {
                success: false,
                message: 'userId is required',
            });
            socket.emit('io-error', {
                success: false,
                message: 'userId id is required',
            });

            return;
        }

        const receiverDetails = await prisma.user.findFirst({
            where: { id: friendId },
            include: { picture: true }
        });

        if (!receiverDetails) {
            callbackFn(callback, {
                success: false,
                message: 'user is not found!',
            });
            socket.emit('io-error', {
                success: false,
                message: 'user is not found!',
            });
            return;
        }

        socket.emit('user-details', receiverDetails);

        const getPreMessage = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId },
                ]
            },
            include: { files: true, receiver: { select: { picture: true } }, sender: { select: { picture: true } } },
            orderBy: {
                createdAt: "asc"
            }
        })

        const chatId = getPreMessage[0]?.chatId
        socket.join(`chat::${chatId}`);

        socket.emit('message', getPreMessage || []);

        //end Notification//
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        socket.emit('io-error', { success: false, message: error });
        console.error('Error in message-page event:', error);
    }
}

export const SendMessageHandle = async (
    io: Server,
    socket: Socket,
    payload: Message,
    userId: string,
    role: Role,
    callback: (arg: any) => void
) => {
    try {
        payload.senderId = userId;

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

        const result = await messagesService.createMessages(payload);

        if (!result) {
            callbackFn(callback, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Message sent failed',
            });
            socket.emit('io-error', {
                success: false,
                message: 'Message sent failed',
            });
            return;
        }

        //------------for receiver----------------
        if (role == Role.ADMIN) {

            // if sender role is admin receiver will get this message
            io.to(`user::${payload?.receiverId}`).emit(`new-message::support`, result)

        } else {

            // id sender role is not admin, send message to the receiver all devices
            const reciverRoom = `user::${payload?.receiverId}`

            io.to(reciverRoom).emit(`new-message::${payload?.senderId}`, result)
        }

        //-------------------for me--------------
        // sent message to the sender all devices
        io.to(`user::${payload?.senderId}`).emit(`new-message::${payload?.receiverId}`, result)

        //---------------hit on chatlist for see last sent message with the chatList------------------//
        getChatList(result?.senderId, io, socket, callback)
        getChatList(result?.receiverId, io, socket, callback)

        //end Notification//
        callbackFn(callback, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Message sent successfully!',
            data: result,
        });
    } catch (error: any) {
        callbackFn(callback, {
            success: false,
            message: error.message,
        });
        socket.emit('io-error', { success: false, message: error });
        console.error('Error in send message event:', error);
    }
}

export const MsgSeenHandle = async (
    io: Server,
    socket: Socket,
    payload: { chatId: string },
    userId: string,
    role: Role,
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

        const chat = await prisma.chat.findFirst({ where: { id: chatId }, include: { participants: true } })

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

        const user1 = chat.participants[0];
        const user2 = chat.participants[1];

        //---------------hit on chatlist for see unread message count with the chatList------------------//
        getChatList(user1?.id, io, socket, callback)
        getChatList(user2?.id, io, socket, callback)

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