import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { jobs } from "../../queues/jobs.name";
import { notificationQueue } from "../../queues/notificaion.queue";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";

const favouritesByUser = async (userId: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const cacheKey = await redisKeys.userFavouriteProductsKey({ userId, query: { limit, skip, sortBy, sortOrder, page } });

    const cached = await redisPub.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

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

    const result = {
        meta: paginationHelper.generatePaginationMeta({
            total,
            page,
            limit,
        }),
        data: favourites,
    };

    // cache the result for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

    return result;
}

const favouriteItem = async (productId: string, userId: string) => {

    //check on redis
    const cacheKey = await redisKeys.userFavouriteItemKey({ userId, productId });
    const cached = await redisPub.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const favouriteItem = await prisma.favourite.findFirst({ where: { userId, productId } });

    if (favouriteItem) {
        //set on redis
        await redisPub.setEx(cacheKey, 3600, JSON.stringify(favouriteItem));
    }

    return favouriteItem;
}

const addFavourite = async (productId: string, currentUser: { id: string, userName: string }) => {

    const { id: userId, userName: currentUserName } = currentUser;

    const favourite_item = await favouriteItem(productId, userId);

    if (favourite_item) {
        throw new AppError(httpStatus.CONFLICT, "Product already exist in favourites");
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

    //invalid redis cache
    await redisKeys.incrementUserVersion({ userId });

    return favourite;
}

const deleteFavourite = async (productId: string, userId: string) => {

    //check favourite exist
    const exist = await favouriteItem(productId, userId);
    if (!exist) {
        throw new AppError(httpStatus.CONFLICT, "Favourite does not exist");
    }

    const favourite = await prisma.favourite.delete({
        where: { id: exist?.id }
    });

    //invalid redis cache
    await redisKeys.incrementUserVersion({ userId });


    return favourite;
}

export const favouriteService = {
    favouritesByUser,
    addFavourite,
    deleteFavourite
}