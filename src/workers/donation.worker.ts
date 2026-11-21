import { connectionInfo } from "../redis";
import { Job, UnrecoverableError, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { UpdatebalanceQueue } from "../queues/balance.queue";
import { jobs } from "../queues/jobs.name";
import { notificationQueue } from "../queues/notificaion.queue";

// =======================Extra Donation Distribute=====================
const extraDonatinDistributeWorker = new Worker("distribute-extra-donation", async (job: Job<{ orderId: string }>) => {


    const { orderId } = job.data;

    const order = await prisma.order.findFirst({
        where: { id: orderId },
        select: {
            buyerId: true,
            items: {
                select: {
                    extraDonations: {
                        select: {
                            charityId: true,
                            charity: {
                                select: {
                                    fcmToken: true
                                }
                            },
                            amount: true
                        }
                    }
                }
            }
        }
    });

    if (!order) {
        throw new UnrecoverableError("Order does not exist");
    }

    const charitiesWithAmount = Array.from(
        order.items
            .flatMap((item) => item.extraDonations)
            .reduce((acc, donation) => {
                const existing = acc.get(donation.charityId);

                acc.set(donation.charityId, {
                    charityId: donation.charityId,
                    fcmToken: donation.charity.fcmToken,
                    amount: (existing?.amount ?? 0) + donation.amount,
                });

                return acc;
            }, new Map<string, { charityId: string; fcmToken: string | null; amount: number }>())
            .values()
    );

    for (let donation of charitiesWithAmount) {

        //create a wallet transaction for the charity with update balance
        await UpdatebalanceQueue.add(jobs.updateBalance, {
            userId: donation?.charityId,
            amount: donation?.amount,
            direction: "IN",
            refId: orderId,
            type: "DONATION_RECEIVED",
            description: `Donation Received from a Bought`
        },
            { jobId: `extra-donation-${orderId}-${donation.charityId}` });

        //send notification to the charity about donation received
        await notificationQueue.add(jobs.notification, {
            allowPushNotification: true,
            payload: {
                title: `Donation Received`,
                message: `Congratulations! You have received a donation of **$${donation?.amount}** from a bought. Check your wallet for the updated balance.`,
                actorId: order?.buyerId,
                receiverId: donation?.charityId,
                entityId: orderId,
                entityType: "DONATION",
                entityImgs: [],
                type: "DONATION_RECEIVED",
                fcmToken: donation?.fcmToken,
                groupKeyId: null,
            }
        })
    }

}, { connection: connectionInfo });


extraDonatinDistributeWorker.on("failed", async (job, err) => {
    if (!job) return;

    //infromation about the failed job

    console.error("distribute-extra-donation failed:", err);

});

extraDonatinDistributeWorker.on("completed", async (job, result) => {
    if (!job) return;

    console.log("distribute-extra-donation completed:", job.id);
});

extraDonatinDistributeWorker.on("error", (err) => {
    console.error("distribute-extra-donation error:", err);
});



// =======================Sell Donation Distribute=====================
const SellDonatinDistributeWorker = new Worker("distribute-sell-donation", async (job: Job<{ orderId: string }>) => {


    const { orderId } = job.data;

    const order = await prisma.order.findFirst({
        where: { id: orderId },
        select: {
            buyerId: true,
            status: true,
            items: {
                select: {
                    donations: {
                        select: {
                            charityId: true,
                            charity: {
                                select: {
                                    fcmToken: true
                                }
                            },
                            amount: true
                        }
                    }
                }
            }
        }
    });

    if (!order) {
        throw new UnrecoverableError("Order does not exist");
    }

    if (order?.status != "COMPLETED") {
        throw new UnrecoverableError("Before complete order tried to distribute sell doantions");
    }

    const charitiesWithAmount = Array.from(
        order.items
            .flatMap((item) => item.donations)
            .reduce((acc, donation) => {
                const existing = acc.get(donation.charityId);

                acc.set(donation.charityId, {
                    charityId: donation.charityId,
                    fcmToken: donation.charity.fcmToken,
                    amount: (existing?.amount ?? 0) + donation.amount,
                });

                return acc;
            }, new Map<string, { charityId: string; fcmToken: string | null; amount: number }>())
            .values()
    );

    for (let donation of charitiesWithAmount) {

        //create a wallet transaction for the charity with update balance
        await UpdatebalanceQueue.add(jobs.updateBalance, {
            userId: donation?.charityId,
            amount: donation?.amount,
            direction: "IN",
            refId: orderId,
            type: "DONATION_RECEIVED",
            description: `Donation Received from a Bought`
        },
            { jobId: `sell-donation-${orderId}-${donation.charityId}` });

        //send notification to the charity about donation received
        await notificationQueue.add(jobs.notification, {
            allowPushNotification: true,
            payload: {
                title: `Donation Received`,
                message: `Congratulations! You have received a donation of **$${donation?.amount}** from a bought. Check your wallet for the updated balance.`,
                actorId: order?.buyerId,
                receiverId: donation?.charityId,
                entityId: orderId,
                entityType: "DONATION",
                entityImgs: [],
                type: "DONATION_RECEIVED",
                fcmToken: donation?.fcmToken,
                groupKeyId: null,
            }
        })
    }

}, { connection: connectionInfo });


SellDonatinDistributeWorker.on("failed", async (job, err) => {
    if (!job) return;

    //infromation about the failed job

    console.error("distribute-sell-donation failed:", err);

});

SellDonatinDistributeWorker.on("completed", async (job, result) => {
    if (!job) return;

    console.log("distribute-sell-donation completed:", job.id);
});

SellDonatinDistributeWorker.on("error", (err) => {
    console.error("distribute-sell-donation error:", err);
});