import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { getChatList } from './handlers/ChatHandler';
import { JoinChatRoom, MessageHandler, MsgSeenHandle, MsgStopTyping, MsgTyping } from './handlers/MessageHandler';
import { socketAuthMiddleware } from './middleware/auth.socket';
import { handleUserOffline, handleUserOnline } from './handlers/StatusHandler';


const initializeSocketIO = (server: HttpServer) => {

  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.use(socketAuthMiddleware);

  // Online users
  // const onlineUser = new Set();

  io.on('connection', async socket => {
    console.log('connected', socket?.id);

    const userId = socket.data?.userId;

    socket.join(`user::${userId}`);

    // -------------get default chat list-------------
    // getChatList(userId, io, () => { })

    //----------------------chat list------------------------//
    socket.on('my-chat-list', async (data, callback) => {
      getChatList(userId, io, callback)
    });

    // for chat list search
    // socket.on('chat-list-search', async (data, callback) => {
    //   getChatList(userId, io, socket, callback, data)
    // });

    //---------------------join chat room------------------
    socket.on('join-chat', async (payload, callback) => {
      JoinChatRoom({ chatId: payload?.chatId, socket, callback })
    });


    //----------------------seen message-----------------------//
    socket.on('seen', async (payload, callback) => {
      MsgSeenHandle(io, socket, payload, userId, callback);
    });

    //-----------------------Typing------------------------//
    socket.on('typing', function (payload, callback) {
      MsgTyping(socket, io, payload, callback, socket.data?.name)
    });

    //-----------------------Stop Typing------------------------//
    socket.on('stopTyping', function (payload, callback) {
      MsgStopTyping(socket, io, payload, callback, socket.data?.name)
    });



    //-----------------------Disconnect------------------------//
    socket.on('disconnect', async (_, callback) => {

      // await prisma.user.update({ where: { id: userId }, data: { isOnline: false } })

      handleUserOffline(userId, io, socket, callback)

      // getChatList(userId, io, socket, callback)

      console.log('disconnect user ', socket.id);
    });


  });

  return io;
};

export default initializeSocketIO;
