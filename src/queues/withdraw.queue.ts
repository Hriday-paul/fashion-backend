import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const WithdrawQueue = new Queue<{ userId: string, connectAccountId: string, amount: number }>("withdraw-balance", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: 10000, // keep for debugging
    }
});