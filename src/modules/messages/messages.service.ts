import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { FileMessageType, Message } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';
import { chatService } from '../chat/chat.service';
import { SendMessageHandle } from '../../socket/handlers/MessageHandler';

type TFile = {
  files?: { key: string; url: string, title: string, type: FileMessageType }[];
  receiverUserName: string;
}

const createMessages = async (payload: Message & TFile) => {

  const { isSeen, chatId, createdAt, receiverUserName, offerId, ...morePayload } = payload;

  const files = payload?.files || []

  const receiver = await prisma.user.findFirst({ where: { userName: payload?.receiverUserName, auth: { isverified: true, status: true } } });

  if (!receiver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Receiver not found');
  }

  morePayload.receiverId = receiver?.id;

  const chat = await chatService.createChat({ currentUserId: payload.senderId, user2Id: receiver?.id });

  const result = await prisma.message.create({
    data: {
      ...morePayload,
      chatId: chat?.id,
      files: {
        createMany: {
          data: files
        }
      }
    },
    include: {
      files: true,
      receiver: {
        select: {
          picture: { select: { url: true } },
          userName: true
        }
      },
      sender: {
        select: {
          picture: { select: { url: true } },
          userName: true
        }
      }
    }
  })

  SendMessageHandle((global as any).socketio, result, () => { })

  return result;
};

// Get all previous messages
const getAllPreMessages = async (friendUserName: string, currentUserId: string, options: TPaginationOptions) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const friend = await prisma.user.findFirst({ where: { userName: friendUserName, auth: { isverified: true, status: true } } });

  if (!friend) {
    return {
      meta: paginationHelper.generatePaginationMeta({ page, limit, total: 0 }),
      data: [],
    };
  }

  const friendId = friend?.id;

  const chat = await prisma.chat.findFirst({
    where: {
      OR: [
        { user1Id: currentUserId, user2Id: friendId },
        { user1Id: friendId, user2Id: currentUserId },
      ],
    },
  });

  if (!chat) {
    return {
      meta: paginationHelper.generatePaginationMeta({ page, limit, total: 0 }),
      data: [],
    };
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId: chat?.id
    },
    include: {
      files: true,
      sender: {
        select: {
          id: true,
          picture: {
            select: {
              url: true
            }
          },
          userName: true
        }
      },
      receiver: {
        select: {
          id: true,
          picture: {
            select: {
              url: true
            }
          },
          userName: true
        }
      },
      offer: {
        include: {
          offerItems: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  finalPrice: true,
                  images: {
                    take: 1,
                    select: {
                      id: true,
                      url: true
                    }
                  }
                }
              }
            }
          },
          seller: {
            select: {
              userName: true,
              picture: {
                select: {
                  url: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    skip,
    take: limit,
  })

  const total = await prisma.message.count({
    where: {
      chatId: chat?.id
    },
  });

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: messages,
  };
};

// Update messages
const updateMessages = async (id: string, payload: Partial<Message>) => {

  const result = await prisma.message.update({
    where: { id },
    data: payload
  })

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message update failed');
  }

  return result;
};

// Get messages by chat ID
const getMessagesByChatId = async (chatId: string) => {
  const result = await prisma.message.findMany({
    where: {
      chatId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  return result;
};

// Get message by ID
const getMessagesById = async (id: string) => {

  return null;
};

const unreadMessageCount = async (id: string) => {


  return null;
};

const deleteMessages = async (id: string) => {
  const message = await prisma.message.findFirst({ where: { id } });

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, 'Oops! Message not found');
  }

  // if (message?.imageUrl) {
  //   await deleteFromS3(
  //     `images/messages/${message?.chat.toString()}/${message?.id}`,
  //   );
  // }

  const result = await prisma.message.delete({ where: { id } });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Oops! Message not found');
  }
  return result;
};

const seenMessage = async (userId: string, chatId: string) => {
  const updateMessages = await prisma.message.updateMany({
    where: {
      chatId: chatId,
      isSeen: false,
      senderId: { not: userId },
    },
    data: {
      isSeen: true,
    },
  });
  return updateMessages;
};

export const messagesService = {
  createMessages,
  getMessagesByChatId,
  getMessagesById,
  updateMessages,
  getAllPreMessages,
  deleteMessages,
  seenMessage,
  unreadMessageCount,

};
