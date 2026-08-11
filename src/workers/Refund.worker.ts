import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { stripe } from "../modules/payments/payments.utils";

// workers/refund.worker.ts
export const refundWorker = new Worker(
    "payment-refund",
    async (job: Job<{
        paymentId: string;
        paymentIntentId: string;
        reason: string;
        triggeredBy: string;
        markPaymentRefunded?: boolean;
        amount?: number;
    }>) => {
        const { paymentId, paymentIntentId, reason, triggeredBy, amount } = job.data;

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new UnrecoverableError("Payment does not exist");
        }

        const intentId = paymentIntentId
        if (!intentId) throw new UnrecoverableError("No Stripe intent ID — cannot refund");


        const refund = await stripe.refunds.create({
            payment_intent: intentId,
            reverse_transfer: true,
            refund_application_fee: true,
            amount: job.data.amount ? job.data.amount * 100 : undefined,
            metadata: {
                paymentId,
                triggeredBy,
                internalReason: reason,
            }
        });

        return refund;

    },
    { connection: connectionInfo }
);

// ✅ সব retry শেষে
refundWorker.on("failed", async (job, err) => {
    if (!job) return;

    const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    const isUnrecoverable = err instanceof UnrecoverableError;

    if (!isExhausted && !isUnrecoverable) return;

    const { paymentId, paymentIntentId } = job.data;

    // await notificationQueue.add(jobs.admin_notification, {
    //         title: "⚠️ Refund FAILED",
    //         message: `Reservation(${reservationId}) refund permanently failed: ${err?.message}. Stripe Intent: ${paymentIntentId}`
    //     });

});

//completed refund worker
refundWorker.on("completed", async (job, err) => {
    if (!job) return;

    const { paymentId, paymentIntentId, markPaymentRefunded = true, reason, amount } = job.data;

    try {

        if (markPaymentRefunded) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "REFUNDED",
                    refundedAt : new Date(),
                }
            });
        }


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