import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

import { TransactionDirection, WalletTransactionType } from "../../generated/prisma/client";

//============generate badges=============

export const UpdatebalanceQueue = new Queue<{ userId: string; amount: number, direction: TransactionDirection, refId ?: string, type: WalletTransactionType, description: string }>("update-balance", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: false, // keep for debugging
    }
});