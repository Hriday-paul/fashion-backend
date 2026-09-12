import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { RefundQueue } from "../queues/refund.queue";
import { jobs } from "../queues/jobs.name";
import { MakeOrderQueue } from "../queues/makeOrder.queue";
// import { RefundQueue } from "../queues/refund.queue";
// import { notificationQueue } from "../queues/notification.queues";

//============off-session capture payment=============

// ── Worker ──────────────────────────────────────────────────────────────────
export const markCompletePaymentWorker = new Worker(
    "mark-payment-complete",
    async (job: Job<{ paymentId: string, paymentIntentId: string, checkoutSessionId: string }>) => {

        const { paymentId, paymentIntentId, checkoutSessionId } = job.data;

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId },
            include: {
                cartGroup: {
                    include: {
                        payments: {
                            where: {
                                status: "SUCCESSED"
                            }
                        }
                    }
                }
            },
        });

        if (!payment) {
            throw new UnrecoverableError("Payment does not exist");
        }

        if (!payment?.cartGroup) {
            // refund issue, don't have cart group

            await RefundQueue.add(jobs.refund, {
                paymentId: paymentId,
                paymentIntentId,
                reason: "Required field is missing",
                triggeredBy: "System",
                markPaymentRefunded: true
            });

            return; // no need to mark payment as complete again
        }

        if (!payment?.cartGroup || payment?.status === "SUCCESSED" || payment?.cartGroup?.payments.length > 0) {
            // refund issue, payment already marked as successed

            await RefundQueue.add(jobs.refund, {
                paymentId: paymentId,
                paymentIntentId,
                reason: "Duplicate payment",
                triggeredBy: "System",
                markPaymentRefunded: true
            });

            return; // no need to mark payment as complete again

        }

        //mark payment as complete
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: "SUCCESSED",
                stripe_status: "ESCROWED",
                paymentIntentId: paymentIntentId,
                checkoutSessionId: checkoutSessionId,
                updatedAt: new Date()
            }
        });

    },
    {
        connection: connectionInfo
    }
);

markCompletePaymentWorker.on("failed", async (job, err) => {
    if (!job) return;

    try {

        const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
        const isUnrecoverable = err instanceof UnrecoverableError;

        if (!isExhausted && !isUnrecoverable) return; // still has retries left

        const { paymentId, paymentIntentId, checkoutSessionId } = job.data;

        //mark payment as failed
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: "FAILED",
                stripe_status: "REFUNDED",
                paymentIntentId: paymentIntentId,
                checkoutSessionId: checkoutSessionId,
                updatedAt: new Date()
            }
        });

        await RefundQueue.add(jobs.refund, {
            paymentId,
            paymentIntentId,
            reason: err?.message ?? "System error",
            triggeredBy: "System",
            markPaymentRefunded: true
        });

    }
    catch (handlerErr) {
        // Admin notify
        // await notificationQueue.add(jobs.admin_notification, {
        //     title: "Payment mark complete failed & Refund failed ⚠️",
        //     message: `Reservation(${job.data?.reservationId}) mark Complete & Refund permanently failed.`
        // });
        console.error("markCompletePaymentWorker failed handler error:", handlerErr);
    }

});

markCompletePaymentWorker.on("completed", async (job, result) => {

    const { paymentId, paymentIntentId, checkoutSessionId } = job.data;

    try {
        const payment = await prisma.payment.findFirst({
            where: { id: paymentId },
        });

        if (!payment) {
            //send notification to admin
            console.error(`Payment not found for paymentId & order creation failed: ${paymentId}`);
            return;
        }

        if (!payment?.cartGroupId) {
            //send notification to admin
            console.error(`Cart group not found for paymentId & order creation failed: ${paymentId}`);
            return;
        }

        //make order after payment is completed
        await MakeOrderQueue.add(jobs.makeOrder, {
            cartGroupId: payment.cartGroupId,
            paymentId,
            paymentIntentId,
        });

    } catch (err) {
        console.error("markCompletePaymentWorker completed handler error:", err);
    }

});

markCompletePaymentWorker.on("error", (err) => {
    console.error("markCompletePaymentWorker error:", err);
});