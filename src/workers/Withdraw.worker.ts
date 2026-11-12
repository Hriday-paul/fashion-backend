import { connectionInfo } from "../redis";
import { Job, UnrecoverableError, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { stripe } from "../modules/payments/payments.utils";
import { notificationQueue } from "../queues/notificaion.queue";
import { jobs } from "../queues/jobs.name";
import { UpdatebalanceQueue } from "../queues/balance.queue";

export const withDrawWorker = new Worker("withdraw-balance", async (job: Job<{ userId: string, connectAccountId: string, amount: number }>) => {

    const { userId, connectAccountId, amount, } = job.data;

    const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: connectAccountId,
    }, {
        // idempotencyKey: idempotencyKey
    });

    //create a wallet transaction & update balance
    await UpdatebalanceQueue.add(jobs.updateBalance, {
        userId: userId,
        amount: amount,
        direction: "OUT",
        type: "WITHDRAWAL",
        description: `Withdrawal Balance`
    },
        { jobId: `withdraw-${transfer?.id}` }
    );


}, { connection: connectionInfo });

withDrawWorker.on("failed", async (job, err) => {
    if (!job) return;

    console.log(err);

    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    const isUnrecoverable = err instanceof UnrecoverableError;

    if (!isExhausted && !isUnrecoverable) return;

    const { userId, connectAccountId, amount } = job.data;
    //notify user about withdraw failure

});

withDrawWorker.on("completed", async (job, result) => {

    const { connectAccountId } = job.data;

    //notification to user about withdraw success


});

withDrawWorker.on("error", (err) => {
    console.error("withdraw error:", err);
});