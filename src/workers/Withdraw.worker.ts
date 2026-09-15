import { connectionInfo } from "../redis";
import { Job, UnrecoverableError, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { stripe } from "../modules/payments/payments.utils";
import { notificationQueue } from "../queues/notificaion.queue";
import { jobs } from "../queues/jobs.name";

export const withDrawWorker = new Worker("withdraw-balance", async (job: Job<{ withdrawId: string, walletId: string, connectAccountId: string }>) => {

    const { withdrawId, walletId, connectAccountId } = job.data;

    const withdrawRequest = await prisma.walletPayout.findFirst({ where: { id: withdrawId } });

    if (!withdrawRequest) {
        throw new UnrecoverableError("Withdraw request does not exist");
    }
    if (withdrawRequest?.status == "PAID") {
        return; // already paid, no need to process again
    }
    if (withdrawRequest?.status == "FAILED") {
        throw new UnrecoverableError("Withdraw request already failed");
    }

    const wallet = await prisma.wallet.findFirst({ where: { id: walletId } });

    if (!wallet) {
        throw new UnrecoverableError("Wallet does not exist");
    }

    //check have enough balance
    if (wallet.balance < withdrawRequest.amount) {
        throw new UnrecoverableError("Insufficient balance");
    }

    const idempotencyKey = `withdrawal_${withdrawRequest.id}`;

    const transfer = await stripe.transfers.create({
        amount: withdrawRequest.amount,
        currency: 'usd',
        destination: connectAccountId,
    }, {
        idempotencyKey: idempotencyKey
    });

    //update withdraw request status to paid
    await prisma.$transaction(async (tx) => {
        await prisma.walletPayout.update({
            where: { id: withdrawRequest.id },
            data: {
                status: "PAID",
                stripePayoutId: transfer.id,
                payoutData: JSON.stringify(transfer),
                stripeBalanceTransactionId: transfer.balance_transaction?.toString(),
                paidAt: new Date()
            }
        });

        //deduct balance from wallet
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    decrement: withdrawRequest.amount
                }
            }
        });

    })


}, { connection: connectionInfo });

withDrawWorker.on("failed", async (job, err) => {
    if (!job) return;

    console.log(err);

    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    const isUnrecoverable = err instanceof UnrecoverableError;

    if (!isExhausted && !isUnrecoverable) return;

    const { withdrawId } = job.data;

    try {

        await prisma.walletPayout.update({
            where: { id: withdrawId },
            data: {
                status: "FAILED"
            }
        });

        //notification to admin about withdraw failure

    } catch (err) {
        console.error("withdraw failed error:", err);
    }

});

withDrawWorker.on("completed", async (job, result) => {

    const { connectAccountId, walletId, withdrawId } = job.data;

    //notification to user about withdraw success

    try {

        const withdrawRequest = await prisma.walletPayout.findFirst({
            where: { id: withdrawId },
            include: {
                user: true
            }
        });

        if (!withdrawRequest?.user) return;

        //send notification to the user about the successful withdrawal
        await notificationQueue.add(jobs.notification, {
            allowPushNotification: true,
            payload: {
                title: `Withdrawal Successful`,
                message: `Congratulations! Your withdrawal of $${withdrawRequest.amount} has been successfully processed and transferred to your account.`,
                actorId: withdrawRequest?.user?.id,
                receiverId: withdrawRequest?.user?.id,
                entityId: withdrawRequest?.user?.id,
                entityType: "WITHDRAWAL",
                entityImgs: [],
                type: "WITHDRAWAL_RECEIVED",
                fcmToken: withdrawRequest?.user?.fcmToken,
                groupKeyId: null,
            }
        })

    } catch (err) {
        console.error("withdraw success notification error:", err);
    }

});

withDrawWorker.on("error", (err) => {
    console.error("withdraw error:", err);
});