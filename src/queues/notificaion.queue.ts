import { Queue } from "bullmq";
import { connectionInfo } from "../redis";
import { Notification } from "../../generated/prisma/client";

type NotificationPayload = Omit<
    Notification,
    "id" | "createdAt" | "updatedAt" | "isRead" | "link"
>;

export const notificationQueue = new Queue<{ allowPushNotification: boolean, payload: NotificationPayload }>(
    "notification",
    {
        connection: connectionInfo,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 100
        }

    },
);

export const pushNotificationQueue = new Queue<{ tokens: string[], payload: { title: string, message: string } }>(
    "push-notification",
    {
        connection: connectionInfo,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 100
        }

    },
);


export const priceDropNotificationQueue = new Queue<{ productId : string, sellerId : string }>(
    "price-drop-notification",
    {
        connection: connectionInfo,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 100
        }

    },
);