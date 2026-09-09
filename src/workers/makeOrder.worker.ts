import { UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";
import { RefundQueue } from "../queues/refund.queue";
import { jobs } from "../queues/jobs.name";
import config from "../config";
import { IShipment } from "../modules/order/order.interface";
import { notificationQueue } from "../queues/notificaion.queue";
import { BadgeGenerateQueue } from "../queues/badge.queue";

// ── Worker ──────────────────────────────────────────────────────────────────
export const makeOrderWorker = new Worker(
    "make-order",
    async (job) => {

        const { cartGroupId, paymentId, paymentIntentId } = job.data;

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
                                weight_kg: true,
                                hight_cm: true,
                                width_cm: true,
                                length_cm: true,
                                description: true,
                                isDeleted: true,
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

        if (!cartGroup?.shippingServiceId) {
            throw new UnrecoverableError("Courier service does not exist");
        }

        const cartgroup = cartGroup;

        const billing_details = await prisma.billingDetails.findFirst({ where: { userId: cartgroup?.userId } });

        const sellerDetails = await prisma.billingDetails.findFirst({ where: { sellerId: cartgroup?.sellerId } });

        if (!billing_details || !sellerDetails) {
            throw new UnrecoverableError(!billing_details ? "Shipping details is required" : "Seller location does not exist for place shipment");
        }

        const itemCount = cartgroup.items.length;

        const bundleDiscountTiers = cartgroup?.seller?.bundleDiscount?.tiers || [];

        const nearestTier = bundleDiscountTiers
            .filter(tier => itemCount >= (tier.itemCount ?? 0))
            .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

        const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

        // Build order in stock items with seller info
        const orderItems = cartgroup.items.filter((item) => (item?.product?.stock > 0 && !item?.product?.isDeleted)).map((item) => {
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

        const stockoutItems = cartgroup.items.filter((item) => (item?.product?.stock <= 0 || item?.product?.isDeleted)).map((item) => {
            const p = item?.product;
            // const donation_percent = p.donation_percent || 0;
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
                donation_percent : 0, // how much percent of the product price will be donated to charity from seller
                donation_amount: 0, // how much amount of the product price will be donated to charity from seller
                charities: item?.charities ?? [],
                isCancelled: true,
                cancelledBy: "SYSTEM",
                cancelReason: "OUT_OF_STOCK",
                cancelReasonDetails: "Product is out of stock, please contact support for further assistance."
            };
        });

        // ====================For Save Ordrer in DB========================
        const itemsTotal = orderItems.reduce((acc, item) => acc + item.unitPrice, 0);

        const totalExtraDonation = orderItems.reduce((acc, item) => acc + (item.extra_donation || 0), 0) + stockoutItems.reduce((acc, item) => acc + (item.extra_donation || 0), 0);

        const otherTotal = (cartgroup.serviceFeeCost || 0) + (cartgroup.treeGiftCost || 0) + (cartgroup.authenticationCost || 0);

        const discountedItemTotal = itemsTotal;

        const sellerDonationTotal = orderItems.reduce((acc, item) => acc + item?.donation_amount, 0);

        const treeCredit = cartgroup?.treeGiftCost;
        const userId = cartgroup?.userId;

        //if no available items in order, then refund the full payment amount to the buyer
        if (orderItems.length === 0) {
            // refund issue, don't have cart group

            await RefundQueue.add(jobs.refund, {
                paymentId: paymentId,
                paymentIntentId,
                reason: "Due to all items in the cart being out of stock, the order could not be processed. A full refund will be issued.",
                triggeredBy: "System",
                markPaymentRefunded: true
            });

            //send notification & email to buyer about order creation failure due to stockout

            // no need to create order in DB, just return from here
            return;
        }

        const shipPayload = {
            "origin_address": {
                "line_1": sellerDetails?.address1,
                "line_2": sellerDetails?.address2,
                "city": sellerDetails?.city,
                "state": sellerDetails?.state,
                "postal_code": sellerDetails?.zip_code,
                "country_alpha2": sellerDetails?.countryCode,
                "company_name": "FASHION",
                "contact_name": cartgroup?.seller?.fname,
                "contact_phone": cartgroup?.seller?.phone,
                "contact_email": cartgroup?.seller?.email
            },
            "destination_address": {
                "line_1": billing_details?.address1,
                "line_2": billing_details?.address2,
                "city": billing_details?.city,
                "state": billing_details?.state,
                "postal_code": billing_details?.zip_code,
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
                            "description": item?.product?.title || "Fashion Product",
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
            throw new UnrecoverableError(errorData?.error?.message || "Shipment creation failed");
        }

        const shipmentData = await rateRes.json() as IShipment;

        const shippingRate = shipmentData?.shipment?.rates.find(rate => rate?.courier_service?.id === cartGroup?.shippingServiceId)?.total_charge || 0;

        const total = discountedItemTotal + otherTotal + totalExtraDonation + shippingRate;

        const parcelId = shipmentData?.shipment?.parcels[0]?.id;

        const shipmentItems = shipmentData?.shipment?.parcels[0]?.items || [];

        // Create order in DB
        const order = await prisma.order.create({
            data: {
                totalPrice: total,
                itemsTotal: discountedItemTotal,
                treeCredit: treeCredit ?? 0,
                buyerId: userId,
                billingId: billing_details?.id,
                sellerId: orderItems[0]?.sellerId,
                sellerItemsTotal: discountedItemTotal,
                sellerTotal: discountedItemTotal - sellerDonationTotal,
                bundleDiscountPercent,
                courier_service_id: cartGroup?.shippingServiceId,

                parcelId,

                currentShipTo: cartgroup.authenticationCost > 0 ? "AUTHENTICATION_CENTER" : "BUYER",

                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                deliveryCharge: {
                    create: {
                        baseCharge: shippingRate,
                        discount: 0,
                        finalCharge: shippingRate,
                        status: "UNPAID",
                        totalItems: orderItems?.length || 0,
                        totalWeight: orderItems?.reduce((acc, item) => acc + (item?.product?.weight_kg || 0), 0),
                    }
                },
                totalDelivery: shippingRate,

                payment: {
                    connect: {
                        id: paymentId
                    }
                },
                items: {
                    create: [...orderItems, ...stockoutItems].map(({ charities, sellerId, donation_amount, donation_percent, product, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            parcelItemId,
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
                    })
                },
            },
        });

        //refund the payment for stockout items
        if (stockoutItems.length > 0) {
            const stockoutRefundAmount = stockoutItems.reduce((acc, item) => acc + item.unitPrice, 0);

            // refund issue
            await RefundQueue.add(jobs.refund, {
                paymentId: paymentId,
                paymentIntentId,
                reason: "Due to some items in the cart being out of stock, a partial refund will be issued for those items.",
                triggeredBy: "System",
                markPaymentRefunded: false,
                amount: stockoutRefundAmount
            });

            //send notification & email to buyer about order item stockout & partial refund
        }

        if (treeCredit > 0) {
            const tree_count = Math.floor(treeCredit / 4); // 1 tree for every $4 spent
            // generate badge for buyer, tree gift badge
            BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TREE_PLANTER", userId, increment: tree_count });
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