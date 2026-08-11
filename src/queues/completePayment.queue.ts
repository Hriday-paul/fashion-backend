import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

//============update the db for payment is completed=============

export const CompletePaymentQueue = new Queue("mark-payment-complete", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: 1000, // keep for debugging
    }
});