import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Chat, Prisma, Role } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';

type TPerticipents = {
  participants: string[]
}

// Create chat
const createChat = async (payload: Chat & TPerticipents) => {
  const user1 = await prisma.user.findFirst({ where: { id: payload?.participants[0] } });

  if (!user1) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  const user2 = await prisma.user.findFirst({ where: { id: payload?.participants[1] } })

  if (!user2) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  const alreadyExists = await prisma.chat.findFirst({
    where: {
      AND: payload?.participants.map((id) => ({
        participants: {
          some: { userId: id }
        }
      }))
    },
    include: {
      participants: {
        include: {
          user: true
        }
      }
    }
  });

  if (alreadyExists) {
    return alreadyExists;
  }

  // create chat if not exist
  const result = await prisma.chat.create({
    data: {
      participants: {
        create: [
          {
            userId: payload?.participants[0]
          },
          {
            userId: payload?.participants[1]
          }
        ]
      }
    }
  })
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat creation failed');
  }
  return result;
};

// Get my chat list
const getMyChatList = async (userId: string, role: Role, query?: Record<string, unknown>) => {

  const isAdmin = role === Role.ADMIN;

  const { searchTerm } = query || {};
  const AndConditions: Prisma.ChatWhereInput[] = [
    {
      participants: {
        some: {
          userId: userId,
        },
      },
    }
  ];

  if (!isAdmin) {
    AndConditions.push({
      participants: {
        none: {
          user: {
            auth: {
              role: Role.ADMIN,
            },
          },
        },
      },
    });
  }

  if (searchTerm) {
    AndConditions.push({
      OR: [
        {
          participants: {
            some: {
              user: {
                fname: {
                  contains: searchTerm as string,
                  mode: "insensitive",
                },
              }
            }
          }
        },
        {
          participants: {
            some: {
              user: {
                email: {
                  contains: searchTerm as string,
                  mode: "insensitive",
                },
              }
            }
          }
        },
        {
          participants: {
            some: {
              user: {
                phone: {
                  contains: searchTerm as string,
                  mode: "insensitive",
                },
              }
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
      participants: {
        where: { userId: { not: userId } }, // exclude current user
        include: {
          user: {
            include: {
              picture: true
            }
          },
        },
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
      participants: {
        include: {
          user: {
            include: {
              picture: true
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
