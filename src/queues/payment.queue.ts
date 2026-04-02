import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const DistributePaymentQueue = new Queue(
    "distribute-payment",
    { connection: connectionInfo }
);

export const ReleasePaymentQueue = new Queue(
    "release-payment",
    { connection: connectionInfo }
);