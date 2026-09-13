import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { RefundQueue } from "../queues/refund.queue";
import { jobs } from "../queues/jobs.name";
import config from "../config";
import { IShipment } from "../modules/order/order.interface";
import { notificationQueue } from "../queues/notificaion.queue";
import { BadgeGenerateQueue } from "../queues/badge.queue";
import crypto from "crypto";

const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `#${timestamp}-${random}`;
};

// ── Worker ──────────────────────────────────────────────────────────────────
export const makeOrderWorker = new Worker(
    "make-order",
    async (job : Job<{ orderId: string; paymentId: string; paymentIntentId: string }>) => {

        const { orderId, paymentId, paymentIntentId } = job.data;

        const order = await prisma.order.findFirst({
            where: { id: orderId },
            include: {
                items: {
                    include: {
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
                                weight_kg: true,
                                hight_cm: true,
                                width_cm: true,
                                length_cm: true,
                                description: true,
                                isDeleted: true,
                            }
                        }
                    }
                }
            }
            // include: {
            //     items: {
            //         include: {
            //             charities: true,
            //             product: {
            //                 select: {
            //                     title: true,
            //                     finalPrice: true,
            //                     id: true,
            //                     charities: {
            //                         select: {
            //                             charityId: true,
            //                             isAnonymous: true,
            //                         },
            //                     },
            //                     donation_percent: true,
            //                     stock: true,
            //                     userId: true,
            //                     weight_kg: true,
            //                     hight_cm: true,
            //                     width_cm: true,
            //                     length_cm: true,
            //                     description: true,
            //                     isDeleted: true,
            //                 }
            //             }
            //         },

            //     },
            //     seller: {
            //         include: {
            //             bundleDiscount: {
            //                 include: {
            //                     tiers: {
            //                         select: {
            //                             discountPercent: true,
            //                             itemCount: true
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //     },
            //     user: true
            // }
        });

        if (!order) {
            throw new UnrecoverableError("Cart group does not exist");
        }

        const truncate = (value: string | null, max = 32) => {
            return value?.trim().slice(0, max) || "";
        };

        const shipPayload = {
            "origin_address": {
                "line_1": truncate(sellerDetails?.address1),
                "line_2": truncate(sellerDetails?.address2),
                "city": truncate(sellerDetails?.city, 20),
                "state": truncate(sellerDetails?.state, 20),
                "postal_code": truncate(sellerDetails?.zip_code, 10),
                "country_alpha2": sellerDetails?.countryCode,
                "company_name": "FASHION",
                "contact_name": cartgroup?.seller?.fname,
                "contact_phone": cartgroup?.seller?.phone,
                "contact_email": cartgroup?.seller?.email
            },
            "destination_address": {
                "line_1": truncate(billing_details?.address1),
                "line_2": truncate(billing_details?.address2),
                "city": truncate(billing_details?.city, 20),
                "state": truncate(billing_details?.state, 20),
                "postal_code": truncate(billing_details?.zip_code, 10),
                "country_alpha2": billing_details?.countryCode,
                "contact_name": billing_details?.full_name,
                "contact_phone": billing_details?.contact,
                "contact_email": billing_details?.email
            },
            "return": false,
            "incoterms": "DDP",
            "order_data": {
                "platform_name": "FASHION",
            },
            "courier_settings": {
                "courier_service_id": cartgroup?.shippingServiceId
            },
            "shipping_settings": {
                "units": {
                    "weight": "kg",
                    "dimensions": "cm"
                }
            },
            "parcels": [
                {
                    "items": orderItems?.map((item) => {
                        return {
                            "description": truncate(item?.product?.title, 64) || "Fashion Product",
                            "category": "fashion",
                            "origin_country_alpha2": billing_details?.countryCode,
                            "quantity": 1,
                            "dimensions": {
                                "height": item?.product?.hight_cm,
                                "width": item?.product?.width_cm,
                                "length": item?.product?.length_cm
                            },
                            "actual_weight": item?.product?.weight_kg,
                            "declared_currency": "USD",
                            "declared_customs_value": item?.product?.finalPrice || 0,
                        }

                    }),
                }
            ]
        }

        const rateRes = await fetch(`${config.easyship.easyship_base_url}/shipments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipPayload)
        });

        if (!rateRes.ok) {
            const errorData = await rateRes.json().catch(() => null);

            console.log(errorData)

            throw new UnrecoverableError(errorData?.error?.message || "Shipment creation failed");
        }

        const shipmentData = await rateRes.json() as IShipment;

        const treeCredit = order?.treeCredit || 0;

        if (treeCredit > 0) {
            const tree_count = Math.floor(treeCredit / 4); // 1 tree for every $4 spent
            // generate badge for buyer, tree gift badge
            BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TREE_PLANTER", userId: order?.buyerId, increment: tree_count });
        }

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

        const { paymentId, paymentIntentId, cartGroupId } = job.data;

        const cartGroup = await prisma.cartGroup.findFirst({
            where: { id: cartGroupId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    take: 1,
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        },
                    }
                },
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fcmToken: true
                    }
                },
                seller: {
                    select: {
                        userName: true,
                        id: true,
                        fcmToken: true
                    }
                }
            }
        });


        if (cartGroup) {
            //send notification to the buyer about order creation failed
            await notificationQueue.add(jobs.notification, {
                allowPushNotification: true,
                payload: {
                    title: `Order Creation Failed`,
                    message: `Sorry, we were unable to process your order due to a system error. Your payment will be refunded shortly.`,
                    actorId: cartGroup?.userId,
                    receiverId: cartGroup?.userId,
                    entityId: cartGroup?.user?.userName,
                    entityType: "ORDER",
                    entityImgs: cartGroup?.items?.map(item => (item?.product?.images[0]?.url)),
                    type: "ORDER_FAILED",
                    fcmToken: cartGroup?.user?.fcmToken,
                    groupKeyId: null,
                }
            })
        }

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

    try {

        const { cartGroupId } = job.data;

        //decrement the items stock after order creation success
        const cartGroup = await prisma.cartGroup.findFirst({
            where: { id: cartGroupId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    take: 1,
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        },
                    }
                },
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fcmToken: true
                    }
                },
                seller: {
                    select: {
                        userName: true,
                        id: true,
                        fcmToken: true
                    }
                }
            }
        });


        await prisma.$transaction(async (tx) => {
            await tx.product.updateMany({
                where: {
                    id: {
                        in: cartGroup?.items?.map(item => {
                            return item?.productId
                        })
                    },
                    stock: {
                        gt: 0
                    }
                },
                data: {
                    stock: {
                        decrement: 1
                    }
                },
            })

            //delete the cart group after order creation success
            await tx.cartGroup.delete({ where: { id: cartGroupId } });
        })

        if (cartGroup) {
            //send notification to the seller about order creation success
            await notificationQueue.add(jobs.notification, {
                allowPushNotification: true,
                payload: {
                    title: `An order has been placed for your items`,
                    message: `**${cartGroup?.user?.userName}** has placed an order for your items. Check your sell order list & make process to ship the items.`,
                    actorId: cartGroup?.userId,
                    receiverId: cartGroup?.sellerId,
                    entityId: cartGroup?.seller?.userName,
                    entityType: "ORDER",
                    entityImgs: cartGroup?.items?.map(item => (item?.product?.images[0]?.url)),
                    type: "ORDER_PLACED",
                    fcmToken: cartGroup?.seller?.fcmToken,
                    groupKeyId: null,
                }
            })

            //send notification to the buyer about order creation success
            await notificationQueue.add(jobs.notification, {
                allowPushNotification: true,
                payload: {
                    title: `Purchase Successful`,
                    message: `Your order has been placed successfully. Check your purchase order list for tracking & shipping details.`,
                    actorId: cartGroup?.userId,
                    receiverId: cartGroup?.userId,
                    entityId: cartGroup?.user?.userName,
                    entityType: "ORDER",
                    entityImgs: cartGroup?.items?.map(item => (item?.product?.images[0]?.url)),
                    type: "ORDER_PLACED",
                    fcmToken: cartGroup?.user?.fcmToken,
                    groupKeyId: null,
                }
            })
        }


    } catch (err) {
        console.log("order cration complete, but items stock decrement get error:", err);
    }

});

makeOrderWorker.on("error", (err) => {
    console.error("makeOrderWorker error:", err);
});