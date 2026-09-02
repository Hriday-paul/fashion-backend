import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { jobs } from "../../queues/jobs.name";
import { notificationQueue } from "../../queues/notificaion.queue";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";

const favouritesByUser = async (userId: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const favourites = await prisma.favourite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            product: {
                include: {
                    images: true,
                    size: true,
                    brand: true
                }
            }
        }
    });

    const total = await prisma.favourite.count({
        where: { userId },
    });

    return {
        meta: paginationHelper.generatePaginationMeta({
            total,
            page,
            limit,
        }),
        data: favourites,
    };
}

const addFavourite = async (productId: string, currentUser: { id: string, userName: string }) => {

    const { id: userId, userName: currentUserName } = currentUser;

    //check favourite exist
    const exist = await prisma.favourite.findFirst({ where: { userId, productId } });
    if (exist) {
        throw new AppError(httpStatus.CONFLICT, "Product already exist in favourite");
    }

    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
        select: {
            userId: true,
            user: {
                select: {
                    userName: true,
                    fcmToken: true
                }
            },
            title: true,
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
                select: {
                    url: true
                }
            }
        }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Item does not exist");
    }

    const favourite = await prisma.favourite.create({
        data: {
            userId,
            productId
        },
        // include: {
        //     product: {
        //         select: {
        //             title: true,
        //             images: {
        //                 take: 1,
        //                 select: {
        //                     url: true
        //                 }
        //             }
        //         }
        //     }
        // }
    });

    //send notification
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true, payload: {
            title: `**${currentUserName}** added your item to favourites`,
            message: `**${currentUserName}** added your **${product?.title}** to their favourites.`,
            actorId: userId,
            receiverId: product?.userId,
            entityId: productId,
            entityType: "PRODUCT",
            entityImgs: product?.images[0]?.url ? [product?.images[0]?.url] : [],
            type: "PRODUCT_LIKE",
            fcmToken: product?.user?.fcmToken,
            groupKeyId: null,
        }
    })

    return favourite;
}

const deleteFavourite = async (productId: string, userId: string) => {

    //check favourite exist
    const exist = await prisma.favourite.findFirst({ where: { userId, productId } });
    if (!exist) {
        throw new AppError(httpStatus.CONFLICT, "Favourite does not exist");
    }

    const favourite = await prisma.favourite.delete({
        where: { id: exist?.id }
    });

    return favourite;
}

export const favouriteService = {
    favouritesByUser,
    addFavourite,
    deleteFavourite
}