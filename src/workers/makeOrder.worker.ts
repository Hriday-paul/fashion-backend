import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { jobs } from "../queues/jobs.name";
import config from "../config";
import { IShipment } from "../modules/order/order.interface";
import { notificationQueue } from "../queues/notificaion.queue";
import { BadgeGenerateQueue } from "../queues/badge.queue";
import crypto from "crypto";

const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `#${timestamp}-${random}`;
};

// ── Worker ──────────────────────────────────────────────────────────────────
export const makeOrderWorker = new Worker(
    "make-order",
    async (job : Job<{ orderId: string; paymentId: string; paymentIntentId: string }>) => {

       

    },
    {
        connection: connectionInfo
    }
);

makeOrderWorker.on("failed", async (job, err) => {
    if (!job) return;

    

});

makeOrderWorker.on("completed", async (job, result) => {

});

makeOrderWorker.on("error", (err) => {
    console.error("makeOrderWorker error:", err);
});