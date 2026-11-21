import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { UpdatebalanceQueue } from "../queues/balance.queue";
import { jobs } from "../queues/jobs.name";
import { notificationQueue } from "../queues/notificaion.queue";

// workers/refund.worker.ts
export const refundWorker = new Worker(
    "payment-refund",
    async (job: Job<{
        paymentId: string;
        reason: string;
        markPaymentRefunded?: boolean;
        amount: number;
        transactionMsg: string;
        notificationMsg: string;
        userId: string;
    }>) => {

        const { paymentId, userId, reason, amount, transactionMsg } = job.data;

        //make a record of the refund in the database
        const refund = await prisma.refund.create({
            data: {
                paymentId,
                amount,
                reason,
                refundedAt: new Date(),
                status: "SUCCESSED",
            }
        });

        //update the balance of the user
        await UpdatebalanceQueue.add(jobs.updateBalance, {
            userId,
            amount,
            direction: "IN",
            refId: paymentId,
            type: "REFUND",
            description: transactionMsg
        }, {
            jobId: `refund-${refund?.id}`
        });

        return;

    },
    { connection: connectionInfo }
);

// ✅ সব retry শেষে
refundWorker.on("failed", async (job, err) => {
    if (!job) return;

    console.log(err);

    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    const isUnrecoverable = err instanceof UnrecoverableError;

    if (!isExhausted && !isUnrecoverable) return;

    const { paymentId, userId, amount, reason } = job.data;

    try {

        //make a record of the refund in the database
        await prisma.refund.create({
            data: {
                paymentId,
                amount: amount ?? undefined,
                reason,
                cancelledAt: new Date(),
                status: "FAILED"
            }
        });

    } catch (err) {
        console.error(
            `Failed to process refundWorker failed event for job ${job.id}:`,
            err
        );
    }

    // await notificationQueue.add(jobs.admin_notification, {
    //         title: "⚠️ Refund FAILED",
    //         message: `Reservation(${reservationId}) refund permanently failed: ${err?.message}. Stripe Intent: ${paymentIntentId}`
    //     });

});

//completed refund worker
refundWorker.on("completed", async (job, err) => {
    if (!job) return;

    const { paymentId, userId, markPaymentRefunded = true, reason, amount, notificationMsg } = job.data;

    try {

        if (markPaymentRefunded) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "REFUNDED",
                    stripe_status: "REFUNDED",
                    refundedAt: new Date(),
                }
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true, id: true }
        });

        if (!user) return;

        // Notify the seller
        await notificationQueue.add(jobs.notification, {
            allowPushNotification: true,
            payload: {
                title: "Refund Processed",
                message: notificationMsg || `$${amount} has been refunded to your account.`,
                actorId: user?.id,
                receiverId: user?.id,
                fcmToken: user?.fcmToken,
                entityImgs: [],
                entityId: paymentId,
                entityType: "PAYMENT",
                type: "REFUND",
                groupKeyId: null,
            }
        });


    } catch (err) {

        // Admin notify
        // await notificationQueue.add(jobs.admin_notification, {
        //     title: "Payment Refunded failed ⚠️",
        //     message: `Reason: ${reason}.`
        // });

        console.error(
            `Failed to process refundWorker completed event for job ${job.id}:`,
            err
        );
    }


});