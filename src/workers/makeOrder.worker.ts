import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { RefundQueue } from "../queues/refund.queue";
import { jobs } from "../queues/jobs.name";
// import { notificationQueue } from "../queues/notification.queues";

// ── Worker ──────────────────────────────────────────────────────────────────
export const makeOrderWorker = new Worker(
    "make-order",
    async (job: Job<{ cartGroupId: string, paymentId: string, paymentIntentId: string }>) => {

        const { cartGroupId, paymentId } = job.data;

        const cartGroup = await prisma.cartGroup.findFirst({
            where: { id: cartGroupId },
            include: {
                items: {
                    include: {
                        charities: true,
                        product: {
                            select: {
                                title: true,
                                finalPrice: true,
                                id: true,
                                charities: {
                                    select: {
                                        charityId: true,
                                        isAnonymous: true,
                                    },
                                },
                                donation_percent: true,
                                stock: true,
                                userId: true,
                            }
                        }
                    },

                },
                seller: {
                    include: {
                        bundleDiscount: {
                            include: {
                                tiers: {
                                    select: {
                                        discountPercent: true,
                                        itemCount: true
                                    }
                                }
                            }
                        }
                    }
                },
                user: true
            }
        });

        if (!cartGroup) {
            throw new UnrecoverableError("Cart group does not exist");
        }

        const cartgroup = cartGroup;

        const billing_details = await prisma.billingDetails.findFirst({ where: { userId: cartgroup?.userId } });

        if (!billing_details) {
            throw new UnrecoverableError("Billing details is required")
        }

        const itemCount = cartgroup.items.length;

        const bundleDiscountTiers = cartgroup?.seller?.bundleDiscount?.tiers || [];

        const nearestTier = bundleDiscountTiers
            .filter(tier => itemCount >= (tier.itemCount ?? 0))
            .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

        const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

        // Build order items with seller info
        const orderItems = cartgroup.items.map((item) => {
            const p = item?.product;
            const donation_percent = p.donation_percent || 0;
            const extra_donation = item.extraDonation || 0;
            const unit_price = p?.finalPrice - (p?.finalPrice * (bundleDiscountPercent / 100))

            const quantity = item.quantity || 1;

            return {
                product: p,
                productId: p.id,
                sellerId: p.userId,
                unitPrice: unit_price,
                totalPrice: unit_price + extra_donation,
                quantity,
                extra_donation,
                donation_percent, // how much percent of the product price will be donated to charity from seller
                donation_amount: (unit_price * (donation_percent / 100)), // how much amount of the product price will be donated to charity from seller
                charities: item?.charities ?? [],
            };
        });

        // ====================For Save Ordrer in DB========================
        const itemsTotal = orderItems.reduce((acc, item) => acc + item.unitPrice, 0);
        const totalExtraDonation = orderItems.reduce((acc, item) => acc + (item.extra_donation || 0), 0);
        const otherTotal = (cartgroup.serviceFeeCost || 0) + (cartgroup.treeGiftCost || 0) + (cartgroup.authenticationCost || 0);


        const discountedItemTotal = itemsTotal

        const total = discountedItemTotal + otherTotal + totalExtraDonation;

        const sellerDonationTotal = orderItems.reduce((acc, item) => acc + item?.donation_amount, 0);

        
        const treeCredit = cartgroup?.treeGiftCost;
        const userId = cartgroup?.userId;

        // Create order in DB
        const result = await prisma.order.create({
            data: {
                totalPrice: total,
                itemsTotal: discountedItemTotal,
                treeCredit: treeCredit ?? 0,
                buyerId: userId,
                billingId: billing_details?.id,
                sellerId: orderItems[0]?.sellerId,
                sellerItemsTotal : discountedItemTotal,
                sellerTotal : discountedItemTotal - sellerDonationTotal,
                bundleDiscountPercent,
                payment: {
                    connect: {
                        id: paymentId
                    }
                },
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        return {
                            ...item,
                            ...(charityCount > 0 && {
                                donations: {
                                    create: charities.map((charity) => {

                                        const productCharity = dbProduct.charities.find(
                                            (c) => c.charityId === charity?.charityId
                                        )!;

                                        return {
                                            charityId: charity?.charityId,
                                            amount: splitAmount,
                                            percent: splitPercent,
                                            extra_money: splitExtra,
                                            total_amount: splitAmount + splitExtra,
                                            status: 'PENDING',
                                            isAnonymous: productCharity?.isAnonymous,
                                        };
                                    }),
                                },
                            }),
                        };
                    }),
                },
            },
        });

    },
    {
        connection: connectionInfo
    }
);

makeOrderWorker.on("failed", async (job, err) => {
    if (!job) return;

    try {

        const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
        const isUnrecoverable = err instanceof UnrecoverableError;

        if (!isExhausted && !isUnrecoverable) return; // still has retries left

        const { paymentId, paymentIntentId } = job.data;

        //refund the payment if order creation failed
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

makeOrderWorker.on("completed", async (job, result) => {

    const { paymentId, paymentIntentId, cartGroupId } = job.data;

    console.log(`makeOrderWorker completed for paymentId: ${paymentId}, paymentIntentId: ${paymentIntentId}`);

    //delete cart group after order creation success
    await prisma.cartGroup.delete({ where: { id: cartGroupId } });

    //send email & notification to buyer & seller about order creation success
    // await notificationQueue.add(jobs.admin_notification, {
    //     title: "Order Created Successfully",
    //     message: `Order has been created successfully for paymentId: ${paymentId}, paymentIntentId: ${paymentIntentId}`
    // });

    //send email & notification to buyer & seller about order creation success

});

makeOrderWorker.on("error", (err) => {
    console.error("makeOrderWorker error:", err);
});