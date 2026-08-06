import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";

const cartsByUser = async (userId: string) => {

    const carts = await prisma.cartGroup.findMany({
        where: { userId, items: { some: {} } },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            size: true,
                        }
                    }
                }
            },
            seller: {
                select: {
                    id: true,
                    userName: true,
                    fname: true,
                    _count: {
                        select: {
                            products: true
                        }
                    },
                    picture: {
                        select: {
                            url: true
                        }
                    }
                }
            },
        }
    });

    return carts;
}

const checkoutItem = async (cartGroupId: string, userId: string) => {

    const carts = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            size: true,
                        }
                    }
                }
            },
            seller: {
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
        }
    });

    if(!carts) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart not found");
    }

    return carts;
}

const addToCart = async (payload: { productId: string, quantity: number, extraDonation: number, extraDonationAnonymous: boolean, charities: { charityId: string }[] }, userId: string) => {
    const { productId, quantity, extraDonation, extraDonationAnonymous, charities } = payload;
    //check product exist
    const product = await prisma.product.findFirst({ where: { id: productId } });
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { productId, group: { userId } } });
    if (cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Product already exist in cart");
    }

    const sellerId = product?.userId;

    const cartGroup = await prisma.cartGroup.upsert({
        where: {
            sellerId: sellerId,
            userId: userId
        },
        update: {
            items: {
                create: {
                    productId,
                    quantity,
                    extraDonation,
                    extraDonationAnonymous,
                    charities: {
                        createMany: {
                            data: charities?.map(charity => ({
                                charityId: charity?.charityId,
                            }))
                        }
                    }
                }
            }
        },
        create: {
            userId,
            sellerId,
            items: {
                create: {
                    productId,
                    quantity,
                    extraDonation,
                    extraDonationAnonymous,
                    charities: {
                        createMany: {
                            data: charities?.map(charity => ({
                                charityId: charity?.charityId,
                            }))
                        }
                    }
                }
            }
        }
    });

    return cartGroup;

}

const deleteCartItem = async (itemId: string, userId: string) => {
    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { id: itemId, group: { userId } } });
    if (!cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Cart item does not exist");
    }

    await prisma.cartItem.delete({ where: { id: cartItemExist.id } });
    return;
}

export const cartService = {
    cartsByUser,
    checkoutItem,
    addToCart,
    deleteCartItem
}