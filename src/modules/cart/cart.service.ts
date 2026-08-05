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
            }
        }
    });
    return carts;
}

const addToCart = async (payload: { productId: string, userId: string, quantity: number, extraDonation: number }) => {
    const { productId, userId, quantity, extraDonation } = payload;
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

    await prisma.cartGroup.upsert({
        where: {
            sellerId: sellerId,
            userId: userId
        },
        update: {
            items: {
                create: {
                    productId,
                    quantity,
                    extraDonation
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
                    extraDonation
                }
            }
        }
    });

}

const deleteCartItem = async (productId: string, userId: string) => {
    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { productId, group: { userId } } });
    if (!cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Cart item does not exist");
    }

    await prisma.cartItem.delete({ where: { id: cartItemExist.id } });
}

export const cartServie = {
    cartsByUser,
    addToCart,
    deleteCartItem
}