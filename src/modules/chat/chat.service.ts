import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Chat, Prisma, Role } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';

type TPerticipents = {
  user1Id: string;
  user2Id: string;
  itemIds: string[];
}

// Create chat
const createChat = async (payload: TPerticipents) => {

  const { user1Id, user2Id, itemIds } = payload;

  const user1 = await prisma.user.findFirst({ where: { id: user1Id } });

  if (!user1) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  const user2 = await prisma.user.findFirst({ where: { id: user2Id } })

  if (!user2) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  const candidateChats = await prisma.chat.findMany({
    where: {
      OR: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],

      items: {
        every: {
          productId: {
            in: itemIds,
          },
        },
      },
    },

    include: {
      items: {
        select: {
          productId: true,
        },
      },
    },
  });

  const existingChat = candidateChats.find((chat) => {
    const chatItemIds = chat.items.map((item) => item.productId);

    return (
      chatItemIds.length === itemIds.length &&
      itemIds.every((id) => chatItemIds.includes(id))
    );
  });

  if (existingChat) {
    return existingChat;
  }

  // create chat if not exist
  const result = await prisma.chat.create({
    data: {
      user1Id,
      user2Id,
      items: {
        createMany: {
          data: itemIds.map((id) => ({ productId: id }))
        }
      }
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

const getChatByItemIds = async (user1Id: string, user2Id: string, itemIds: string[]) => {
  const candidateChats = await prisma.chat.findMany({
    where: {
      OR: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],

      items: {
        every: {
          productId: {
            in: itemIds,
          },
        },
      },
    },

    include: {
      items: {
        select: {
          productId: true,
        },
      },
    },
  });

  const existingChat = candidateChats.find((chat) => {
    const chatItemIds = chat.items.map((item) => item.productId);

    return (
      chatItemIds.length === itemIds.length &&
      itemIds.every((id) => chatItemIds.includes(id))
    );
  });

  return existingChat;
}

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
  deleteChatList,
  getChatByItemIds
};
