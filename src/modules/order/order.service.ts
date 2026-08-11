import { CancelOrderEvidence } from "../../../generated/prisma/browser";
import { CancelReason, Order, OrderStatus, Prisma } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { DistributePaymentQueue } from "../../queues/payment.queue";
import prisma from "../../shared/prisma";
import httpStatus from "http-status"
import generateRandomString from "../../utils/generateRandomString";
import { createCheckoutSession } from "../payments/payments.utils";


const addNewOrder = async (
    // payload: Order & { products: PayloadItem[] },
    payload: { cartGroupId: string, shipmentServiceId: string },
    userId: string
) => {

    const cartgroup = await prisma.cartGroup.findFirst({
        where: {
            id: payload.cartGroupId,
            userId
        },
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
                            userId: true, // sellerId
                            donation_percent: true,
                            stock: true,
                            images: {
                                select: {
                                    url: true
                                }
                            }
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
    })

    if (!cartgroup) {
        throw new AppError(httpStatus.NOT_FOUND, "Checkout cart does not exist")
    }

    //check cart owner is the current user
    if (cartgroup.userId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the owner of this cart")
    }

    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        throw new AppError(httpStatus.NOT_FOUND, "Billing details is required")
    }


    //Validate cart products' charities belong to the product
    for (const payloadItem of cartgroup.items) {
        const dbProduct = payloadItem?.product;

        // Validate all products have enough stock
        if (dbProduct.stock < payloadItem.quantity) {
            throw new AppError(httpStatus.BAD_REQUEST,
                dbProduct.stock === 0
                    ? `${payloadItem.product?.title} is out of stock`
                    : `Only ${dbProduct.stock} unit(s) of "${payloadItem.product?.title}" left in stock`
            );
        }

        const allowedCharityIds = dbProduct.charities.map((c) => c.charityId);

        if (!allowedCharityIds.length) continue;

        // ✅ At least 1 charity required if have At least 1 charity to the product
        if (payloadItem.charities?.length === 0 && dbProduct.donation_percent > 0) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `At least one charity is required for ${payloadItem?.product?.title}`
            );
        }

        // ✅ All provided charities must exist in the product
        const invalidCharities = payloadItem.charities.filter(
            (charity) => !allowedCharityIds.includes(charity?.charityId)
        );

        if (invalidCharities.length > 0) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `Invalid charities [${invalidCharities.join(', ')}] for product ${payloadItem?.product?.title}`
            );
        }
    }

    const itemCount = cartgroup.items.length;

    const bundleDiscountTiers = cartgroup?.seller?.bundleDiscount?.tiers || [];

    const nearestTier = bundleDiscountTiers
        .filter(tier => itemCount >= (tier.itemCount ?? 0))
        .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

    const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

    // order products
    const orderItems = cartgroup.items.map((item) => {
        const p = item?.product;
        return {
            amount: p?.finalPrice - (p?.finalPrice * (bundleDiscountPercent / 100)),
            images: p?.images.map(img => img?.url),
            name: p?.title,
            quantity: 1,
        }
    });

    const extra_donation = cartgroup.items.reduce((itemSum, item) => itemSum + (item?.extraDonation ?? 0), 0);

    const donation_charge = {
        amount: extra_donation,
        images: [],
        name: "Extra Donation",
        quantity: 1,
    }

    const treeCost = {
        amount: cartgroup.treeGiftCost,
        images: [],
        name: "Tree plantation cost",
        quantity: 1,
    }

    const authenticationCost = {
        amount: cartgroup.authenticationCost,
        images: [],
        name: "Authentication & Quality Control",
        quantity: 1,
    }

    const serviceFee = {
        amount: cartgroup.serviceFeeCost,
        images: [],
        name: "Service Fee",
        quantity: 1,
    }

    // build delivery charge line item
    const totalDeliveryCharge = 0;

    const delivary_charge = {
        amount: totalDeliveryCharge,
        images: [],
        name: "Delivery Charge",
        quantity: 1,
    }

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.amount, 0);
    const otherTotal = (cartgroup.serviceFeeCost || 0) + (cartgroup.treeGiftCost || 0) + (cartgroup.authenticationCost || 0);

    const totalExtraDonation = cartgroup.items.reduce((acc, item) => acc + (item.extraDonation || 0), 0);

    const total = discountedItemTotal + otherTotal + totalExtraDonation;

    const sellerTotal = cartgroup.items.reduce((acc, item) => {

        const unit_price = item?.product?.finalPrice - (item?.product?.finalPrice * (bundleDiscountPercent / 100))

        const final_Unit_price = unit_price;

        return acc + final_Unit_price;
    }, 0);

    //check a success payment exist for this cart group,
    const isExistSuccessPayment = await prisma.payment.findFirst({
        where: {
            cartGroupId: cartgroup.id,
            userId: userId,
            status: "SUCCESSED"
        }
    });

    if (isExistSuccessPayment) {
        throw new AppError(httpStatus.BAD_REQUEST, "A successful payment already exists for this cart. Please check your order history.");
    }

    const tranId = generateRandomString(10);

    const result = await prisma.$transaction(async (transactionClient) => {

        //create new payment for this cart group
        const createdPayment = await transactionClient.payment.create({
            data: {
                userId,
                total_amount: total,
                paid_amount: 0,
                seller_required_amount: sellerTotal,
                seller_received_amount: 0,
                status: "PENDING",
                stripe_status: "PENDING",
                cartGroupId: cartgroup.id,
                transactionId: tranId,
            },
            include: {
                user: true
            }
        })

        //save shiping serviceId to cartGroup
        await transactionClient.cartGroup.update({
            where: {
                id: cartgroup.id
            },
            data: {
                shippingServiceId: payload?.shipmentServiceId
            }
        })

        return createdPayment;

    })

    // generate payment link
    const checkoutSession = await createCheckoutSession({
        // customerId: customer.id,
        products: [...orderItems, donation_charge, delivary_charge, treeCost, authenticationCost, serviceFee],
        user: cartgroup?.user,
        paymentId: result?.id
    });

    return checkoutSession?.url

}

const cancelOrderItemBySeller = async (payload: { orderItemId: string, reason: string, details: string, evidence: CancelOrderEvidence[] }, current_sellerId: string) => {

    const { reason, details, evidence, orderItemId } = payload;

    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: orderItemId,
        },
        include: {
            order: {
                select: {
                    sellerId: true,
                    status: true
                }
            }
        }
    })
    if (!orderItem) {
        throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist")
    }

    // you are not the seller of this order item
    if (orderItem?.order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order item")
    }

    if (orderItem?.order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check if the order item is already cancelled
    if (orderItem?.isCancelled) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order item is already cancelled")
    }

    //check item status, only allow cancel if the item is in PENDING or SHIPPED status
    if (orderItem?.order?.status !== "PENDING" && orderItem?.order?.status !== "SHIPPED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process cancel the order item")
    }

    //mark payment is refunded, if the payment is already paid

    //update the order item status to cancelled
    await prisma.orderItem.update({
        where: {
            id: orderItemId,
        },
        data: {
            isCancelled: true,
            cancelReason: reason as CancelReason,
            cancelReasonDetails: details,
            cancelledBy: "SELLER",
            cancelEvidence: {
                createMany: {
                    data: evidence.map(e => ({
                        type: e?.type,
                        url: e?.url,
                        key: e?.key
                    }))
                }
            }
        }
    })
}

const requestCancelOrderItem = async (payload: { orderItemId: string, reason: string, details: string, evidence: CancelOrderEvidence[] }, userId: string) => {
    const { orderItemId, reason, details, evidence } = payload;

    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: orderItemId,
        },
        include: {
            order: {
                select: {
                    status: true,
                    buyerId: true
                }
            }
        }
    })

    if (!orderItem) {
        throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist")
    }

    if (orderItem?.isBuyerRequestCancel) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already requested to cancel this order item")
    }

    if (orderItem?.order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check current user is the buyer of the order item
    if (orderItem?.order?.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the buyer of this order item")
    }

    //check if the order item is already cancelled
    if (orderItem?.isCancelled) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order item is already cancelled")
    }

    //check item status, only allow cancel if the item is in PENDING or SHIPPED status
    if (orderItem?.order?.status !== "PENDING" && orderItem?.order?.status !== "SHIPPED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to request cancel the order item")
    }

    await prisma.orderItem.update({
        where: {
            id: orderItemId,
        },
        data: {
            isBuyerRequestCancel: true,
            cancelReason: reason as CancelReason,
            cancelReasonDetails: details,
            cancelEvidence: {
                createMany: {
                    data: evidence.map(e => ({
                        type: e?.type,
                        url: e?.url,
                        key: e?.key
                    }))
                }
            }
        }
    })

}

const approveCancelOrderItemBySeller = async (orderItemId: string, current_sellerId: string) => {

    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: orderItemId,
        },
        include: {
            order: {
                select: {
                    sellerId: true,
                    status: true
                }
            }
        }
    })

    if (!orderItem) {
        throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist")
    }

    // you are not the seller of this order item
    if (orderItem?.order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order item")
    }

    //check if the order item is already cancelled
    if (orderItem?.isCancelled) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order item is already cancelled")
    }

    if (orderItem?.order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check is requested by buyer to cancel the order item
    if (!orderItem?.isBuyerRequestCancel) {
        throw new AppError(httpStatus.BAD_REQUEST, "No request to cancel the order item from buyer")
    }

    //check item status, only allow cancel if the item is in PENDING or SHIPPED status
    if (orderItem?.order?.status !== "PENDING" && orderItem?.order?.status !== "SHIPPED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process cancel the order item")
    }

    // refund the payment to buyer, if the payment is already paid

    //update the order item status to cancelled
    await prisma.orderItem.update({
        where: {
            id: orderItemId,
        },
        data: {
            isCancelled: true,
            cancelledBy: "SELLER",
        }
    })
}

const confirmOrderReceived = async (orderId: string, userId: string) => {
    //check exist order received
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        include: {
            items: {
                select: {
                    isCancelled: true,
                    id: true
                }
            },
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found")
    }

    if (order?.status !== "DELIVERED" || order?.currentShipTo !== "BUYER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process confirm order received")
    }

    //check current user is the buyer of the order
    if (order?.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the buyer of this order")
    }

    // //mark order received
    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "COMPLETED"
        }
    })

    // distribute the payment
    // await DistributePaymentQueue.add(
    //     "distribute-payment",
    //     { orderSellerGroupId },
    //     {
    //         jobId: order?.id,
    //         removeOnComplete: true,
    //     }
    // );

}

const ordersBySeller = async (sellerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.OrderWhereInput[] = [{ sellerId }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    id: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                fname: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                lname: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                phone: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            }
                        ],
                    }
                },
                {
                    billingDetails: {
                        OR: [
                            {
                                full_name: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                contact: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                email: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address1: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address2: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            }
                        ]
                    }
                },
                {
                    items: {
                        some: {
                            product: {
                                OR: [
                                    {
                                        title: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },
                                    {
                                        description: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        }
                                    },
                                    {
                                        id: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },

                                ]
                            },
                        }
                    }
                },
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as OrderStatus
        })
    }

    const whereConditions: Prisma.OrderWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            title: true,
                            description: true,
                            id: true,
                            condition: true,
                            finalPrice: true,
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            category: {
                                select: {
                                    name: true
                                }
                            },
                            size: {
                                select: {
                                    title: true
                                }
                            },
                            _count: true
                        },
                    },
                    returnItem: {
                        include: {

                        }
                    }
                }
            },

            buyer: {
                select: {
                    fname: true,
                    lname: true,
                    email: true,
                    phone: true,
                    picture: {
                        select: {
                            url: true
                        }
                    }
                }
            },
            billingDetails: true
        },
    })

    const total = await prisma.order.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
}

const markShippedOrder = async (orderId: string, current_sellerId: string) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        include: {
            items: true,
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.status !== "PENDING") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process mark as shipped the order")
    }

    if (order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }

    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "SHIPPED"
        }
    })

    return;

}


export const orderService = {
    addNewOrder,
    ordersBySeller,
    cancelOrderItemBySeller,
    requestCancelOrderItem,
    approveCancelOrderItemBySeller,
    confirmOrderReceived,
    markShippedOrder
}