import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Message } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';
import { chatService } from '../chat/chat.service';

type TFile = {
  files?: { key: string; url: string }[];
  itemIds?: string[];
}

const createMessages = async (payload: Message & TFile) => {

  if (!payload?.chatId) {

    const chat = await chatService.createChat({ itemIds: payload?.itemIds || [], user1Id: payload?.senderId, user2Id: payload?.receiverId });

    payload.chatId = chat?.id;
  }

  const files = payload?.files || []

  const result = await prisma.message.create({
    data: {
      ...payload,
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

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message creation failed');
  }

  return result;
};

// Get all previous messages
const getAllPreMessages = async (chatId: string, options: TPaginationOptions) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId
    },
    include: {
      files: true,
      sender: {
        select: {
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
          picture: {
            select: {
              url: true
            }
          },
          userName: true
        }
      },
      offer: true
    },
    orderBy: {
      createdAt: "asc"
    },
    skip,
    take: limit,
  })

  const total = await prisma.message.count({
    where: {
      chatId: chatId
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
