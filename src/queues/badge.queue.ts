import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

import { BadgeType, Role } from "../../generated/prisma/client";

//============generate badges=============

export const BadgeGenerateQueue = new Queue<{ type : BadgeType, userId : string, increment ?: number }>("badge", {
    connection: connectionInfo,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
        removeOnComplete: true,
        removeOnFail: 1000, // keep for debugging
    }
});