import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Message } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';

type TFile = {
  files?: { key: string; url: string }[];
}

const createMessages = async (payload: Message & TFile) => {

  const alreadyExists = await prisma.chat.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: payload.senderId } } },
        { participants: { some: { userId: payload.receiverId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: true, // include user info like populate
        },
      },
    },
  });


  if (!alreadyExists) {

    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            {
              userId: payload?.senderId
            },
            {
              userId: payload?.receiverId
            }
          ]
        }
      }
    })

    payload.chatId = chat?.id;
  } else {
    payload.chatId = alreadyExists?.id;
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
    include: { files: true, receiver: { include: { picture: true } }, sender: { include: { picture: true } } }
  })

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message creation failed');
  }

  return result;
};

// Get all previous messages
const getAllPreMessages = async (userId: string, friendId: string, options: TPaginationOptions) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ]
    },
    include: { files: true },
    orderBy: {
      createdAt: "asc"
    },
    skip,
    take: limit,
  })

  const total = await prisma.message.count({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ]
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
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
