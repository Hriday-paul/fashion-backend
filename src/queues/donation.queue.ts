import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

//============Extra Donatin=============
export const ExtraDonationQueue = new Queue<{ orderId: string }>("distribute-extra-donation", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: 1000, // keep for debugging
    }
});

export const SellDonationQueue = new Queue<{ orderId: string }>("distribute-sell-donation", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: 1000, // keep for debugging
    }
});