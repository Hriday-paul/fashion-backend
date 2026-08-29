import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { getChatList } from './handlers/ChatHandler';
import { MessageHandler, MsgSeenHandle, MsgStopTyping, MsgTyping, SendMessageHandle } from './handlers/MessageHandler';
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
    const adminId = socket.data?.adminId;
    const role = socket.data?.role;

    socket.join(`user::${userId}`);

    // online driver
    handleUserOnline(userId, role, io, socket, () => { })

    // -------------get default chat list-------------
    // const chatList = await chatService.getMyChatList(userId);
    // const myChat = 'chat-list::' + userId;

    // io.emit(myChat, chatList);

    //--------user details and messages send for front end -->(as need to use)---------------//
    socket.on('message-page', async (payload, callback) => {
      MessageHandler(userId, payload, io, socket, callback)
    });

    //----------------------chat list------------------------//
    socket.on('my-chat-list', async (data, callback) => {
      getChatList(userId, io, socket, callback)
    });

    // for chat list search
    // socket.on('chat-list-search', async (data, callback) => {
    //   getChatList(userId, io, socket, callback, data)
    // });

    //----------------------seen message-----------------------//
    socket.on('seen', async (payload, callback) => {
      MsgSeenHandle(io, socket, payload, userId, callback);
    });

    socket.on('send-message', async (payload, callback) => {
      SendMessageHandle(io, socket, payload, userId, callback)
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

      handleUserOffline(userId, role, io, socket, callback)

      // getChatList(userId, io, socket, callback)

      console.log('disconnect user ', socket.id);
    });


  });

  return io;
};

export default initializeSocketIO;
