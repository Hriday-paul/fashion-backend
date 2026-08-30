import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Chat, Prisma } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';

type TPerticipents = {
  currentUserId: string;
  user2Id: string;
}

// Create chat
const createChat = async (payload: TPerticipents) => {

  const { currentUserId, user2Id } = payload;

  if (currentUserId === user2Id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot create chat with yourself');
  }

  const friend = await prisma.user.findFirst({ where: { id: currentUserId, auth: { isverified: true, status: true } } });

  if (!friend) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  const existingChat = await prisma.chat.findFirst({
    where: {
      OR: [
        { user1Id: currentUserId, user2Id },
        { user1Id: user2Id, user2Id: currentUserId },
      ],
    }
  });

  if (existingChat) {
    return existingChat;
  }

  // create chat if not exist
  const result = await prisma.chat.create({
    data: {
      user1Id: currentUserId,
      user2Id,
    }
  })

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat creation failed');
  }

  return result;
};

// Get my chat list
const getMyChatList = async (userId: string, query?: Record<string, unknown>) => {

  const { searchTerm } = query || {};
  const AndConditions: Prisma.ChatWhereInput[] = [
    {
      OR: [
        {
          user1Id: userId
        },
        {
          user2Id: userId
        }
      ]
    }
  ];

  if (searchTerm) {
    AndConditions.push({
      OR: [
        {
          user1: {
            userName: {
              contains: searchTerm as string,
              mode: 'insensitive'
            }
          }
        },
        {
          user2: {
            userName: {
              contains: searchTerm as string,
              mode: 'insensitive'
            }
          }
        }
      ],
    });
  }

  const whereConditions: Prisma.ChatWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

  const chats = await prisma.chat.findMany({
    where: whereConditions,
    include: {
      user1: {
        select: {
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      },
      user2: {
        select: {
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              isSeen: false,
              senderId: { not: userId }
            }
          }
        }
      }
    }
  });

  const sortedChats = chats.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt?.getTime() || 0;
    const bTime = b.messages[0]?.createdAt?.getTime() || 0;
    return bTime - aTime;
  });

  return sortedChats;
};

// Get chat by ID
const getChatById = async (chatId: string) => {

  const result = await prisma.chat.findFirst({
    where: { id: chatId },
    include: {
      user1: {
        select: {
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      },
      user2: {
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
  })

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat not found');
  }
  return result;
};

// Update chat list
const updateChatList = async (id: string, payload: Partial<Chat>) => {
  const result = await prisma.chat.update({
    where: { id },
    data: payload
  })
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat not found');
  }
  return result;
};

// Delete chat list
const deleteChatList = async (id: string) => {
  const result = await prisma.chat.delete({
    where: {
      id
    }
  });
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat not found');
  }
  return result;
};

export const chatService = {
  createChat,
  getMyChatList,
  getChatById,
  updateChatList,
  deleteChatList
};
