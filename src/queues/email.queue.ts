import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const emailQueue = new Queue<{
    to: string;
    subject: string;
    html: string;
}>(
    "email",
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