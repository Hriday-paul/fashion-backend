import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const RefundQueue = new Queue<{
        paymentId: string;
        reason: string;
        markPaymentRefunded?: boolean;
        amount: number;
        transactionMsg: string;
        notificationMsg: string;
        userId: string;
    }>("payment-refund", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: 1000,
    }
});