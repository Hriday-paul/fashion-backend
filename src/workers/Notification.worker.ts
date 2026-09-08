import { connectionInfo } from "../redis";
import { Job, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { Notification } from "../../generated/prisma/client";
import { pushNotificationQueue } from "../queues/notificaion.queue";
import { jobs } from "../queues/jobs.name";
import { sendPushNotification } from "../modules/notification/notification.utils";

const notificationWorker = new Worker("notification", async (job: Job<{ allowPushNotification: boolean, payload: Notification }>) => {


    const { allowPushNotification, payload } = job.data;

    const { title, message, fcmToken } = payload;

    if (allowPushNotification && fcmToken) {
        //send push notification to the receiver
        pushNotificationQueue.add(jobs.sendPushNotification, { tokens: [fcmToken], payload: { title: title, message: message } });
    }

    //save notification to the database
    await prisma.notification.create({
        data: payload
    });

}, { connection: connectionInfo });


const pushnotificationWorker = new Worker("push-notification", async (job: Job<{ tokens: string[], payload: { title: string, message: string } }>) => {


    const { tokens, payload } = job.data;

    //send push notification to the receiver
    await sendPushNotification(tokens, payload);

}, { connection: connectionInfo });


const priceDropNotificationWorker = new Worker("price-drop-notification", async (job: Job<{ productId: string, sellerId: string }>) => {


    const { productId, sellerId } = job.data;

    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
        select: {
            userId: true,
            title: true,
            finalPrice: true,
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
        throw new Error("Product Does not exist");
    }

    //collecting the users who have favourited, in cart this product or folowing the seller of this product
    const users = await prisma.user.findMany({
        distinct: "id",
        where: {
            OR: [

                {
                    favouriteProducts: {
                        some: {
                            productId: productId
                        }
                    }
                },

                {
                    carts: {
                        some: {
                            items: {
                                some: {
                                    productId: productId
                                }
                            }
                        }
                    }
                },
                {
                    following: {
                        some: {
                            followingId: sellerId
                        }
                    }
                }
            ]
        },
        select: {
            fcmToken: true,
            id: true,
            userName: true
        }
    });

    const tokens = users.map(user => user.fcmToken).filter(token => token !== null) as string[];

    //send notification to all the users
    if (tokens.length > 0) {
        pushNotificationQueue.add(jobs.sendPushNotification, { tokens, payload: { title: `**${product?.title}** Price Droped`, message: `The price of ${product?.title} has dropped to **${product?.finalPrice}**. Check it out!` } });
    }

    //save notification to the database
    await prisma.notification.createMany({
        data: users.map(user => ({
            actorId: sellerId,
            receiverId: user.id,
            entityId: productId,
            entityType: "PRODUCT",
            entityImgs: product?.images?.[0]?.url ? [product?.images?.[0]?.url] : [],
            type: "PRICE_DROP",
            fcmToken: user.fcmToken,
            groupKeyId: user?.userName || null,
            title: `**${product?.title}** Price Droped`,
            message: `The price of **${product?.title}** has dropped to **$${product?.finalPrice}**. Check it out!`
        }))
    });

}, { connection: connectionInfo });