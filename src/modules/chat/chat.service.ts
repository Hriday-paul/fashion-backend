import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Chat, Prisma } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import moment from 'moment';

type TPerticipents = {
  currentUserId: string;
  user2Id: string;
  products: string[];
}

// Create chat
const createChat = async (payload: TPerticipents) => {
  const { currentUserId, user2Id } = payload;

  // Remove duplicate product IDs
  const products = [...new Set(payload.products)];

  if (currentUserId === user2Id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot create chat with yourself'
    );
  }

  if (!products.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'At least one product is required'
    );
  }

  const friend = await prisma.user.findFirst({
    where: {
      id: user2Id,
      auth: {
        isverified: true,
        status: true,
        approval_status: 'Approved'
      }
    }
  });

  if (!friend) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid user');
  }

  // Find existing chats between these users
  const existingChats = await prisma.chat.findMany({
    where: {
      OR: [
        { user1Id: currentUserId, user2Id },
        { user1Id: user2Id, user2Id: currentUserId }
      ],
      items: {
        some: {
          productId: { in: products }
        }
      }
    },
    include: {
      items: true
    }
  });

  // Check exact product matching
  const existingChat = existingChats.find(chat => {
    const existingProducts = chat.items
      .map(item => item.productId)
      .sort();

    const requestedProducts = [...products].sort();

    return (
      existingProducts.length === requestedProducts.length &&
      existingProducts.every(
        (id, index) => id === requestedProducts[index]
      )
    );
  });

  if (existingChat) {
    return existingChat;
  }

  // Create new chat
  return prisma.chat.create({
    data: {
      user1Id: currentUserId,
      user2Id,
      items: {
        createMany: {
          data: products.map(productId => ({ productId }))
        }
      }
    },
    include: {
      items: true
    }
  });
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
    },
    {
      messages: {
        some: {}
      }
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
          id: true,
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
          id: true,
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      },
      items: {
        select: {
          id: true,
          product: {
            select: {
              images: {
                take: 1,
                orderBy: {
                  order: 'asc'
                },
                select: {
                  url: true,
                  id: true
                }
              }
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          files: {
            take: 1,
            select: {
              url: true,
              type: true
            }
          },
          offer: {
            select: {
              status: true,
              sellerId: true,
              buyerId: true
            }
          }
        }
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
const getChatById = async (chatId: string, userId: string) => {

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              userId: true,
              id: true,
              title: true,
              finalPrice: true,
              stock: true,
              isDeleted: true,
              images: {
                take: 1,
                orderBy: {
                  order: 'asc'
                },
                select: {
                  id: true,
                  url: true
                }
              }
            }
          }
        }
      }

    }
  });

  if (!chat) {
    return null;
  }

  const fuserId = chat?.user1Id === userId ? chat?.user2Id : chat?.user1Id;

  const itemsPrice = chat?.items.reduce((acc, item) => acc + item.product.finalPrice, 0);

  const isUnavailable = chat?.items.some(item => item.product.stock === 0 || item.product?.isDeleted);

  const user = await prisma.user.findFirst({
    where: {
      id: fuserId
    },
    select: {
      id: true,
      picture: {
        select: {
          url: true
        }
      },
      userName: true,
    }
  });

  const isImSeller = chat?.items.some(item => item.product.userId === userId);

  return {
    id: chat.id,
    user,
    items: chat.items,
    itemsPrice,
    isUnavailable,
    isImSeller
  };


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

const createOfferByChatForBuy = async (payload: { sellerId: string, chatId: string }, currentUserId: string) => {

  const { sellerId, chatId } = payload;

  const productsOnChat = await prisma.chatItem.findMany({
    where: {
      chatId
    },
    select: {
      productId: true,
      product: {
        select: {
          id: true,
          finalPrice: true,
          isDeleted: true,
          stock: true
        }
      }
    }
  });

  const haveStockOutOrDlt = productsOnChat.some(p => p.product.isDeleted || p.product.stock === 0);

  if (haveStockOutOrDlt) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Some items are no longer available.');
  }

  const actualPrice = productsOnChat.reduce((sum, p) => sum + p.product.finalPrice, 0);

  //check existing offer avaialble
  // const existingOffer = await prisma.offer.findFirst({
  //   where: {
  //     buyerId: currentUserId,
  //     sellerId,
  //     status: 'ACCEPTED',
  //     offerItems: {
  //       some: {
  //         productId: { in: productsOnChat.map(p => p.productId) }
  //       }
  //     }
  //   }
  // });

  const offer = await prisma.offer.create({
    data: {
      buyerId: currentUserId,
      sellerId,
      offeredPrice: actualPrice,
      actualPrice: actualPrice,
      offerItems: {
        create: productsOnChat.map(p => ({
          productId: p?.productId,
          quantity: 1
        }))
      },
      expiredAt: moment().add(3, 'days').toDate(),
      sendByBuyer: true,
      status: "ACCEPTED"
    }
  });

  return offer;

}

export const chatService = {
  createChat,
  getMyChatList,
  getChatById,
  updateChatList,
  deleteChatList,
  createOfferByChatForBuy
};
