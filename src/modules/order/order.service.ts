import { CancelOrderEvidence } from "../../../generated/prisma/browser";
import { CancelReason, Order, OrderItem, OrderStatus, Prisma } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { DistributePaymentQueue } from "../../queues/payment.queue";
import prisma from "../../shared/prisma";
import httpStatus from "http-status"

interface PayloadItem extends OrderItem {
    extra_donation: number,
    charities: string[]
}

const addNewOrder = async (payload: Order & { products: PayloadItem[] }, userId: string): Promise<Order> => {
    const { products, treeCredit } = payload;

    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        throw new AppError(httpStatus.NOT_FOUND, "Billing details is required")
    }

    // Fetch prices
    const prod_prices = await prisma.product.findMany({
        where: {
            id: {
                in: products?.map(p => p?.productId)
            }
        },
        select: {
            finalPrice: true,
            id: true,
            charities: {
                select: {
                    charityId: true,
                    isAnonymous: true,
                },
            },
            userId: true, // sellerId
            donation_percent: true
        }
    })

    // Validate all products exist
    if (prod_prices.length !== products.length) {
        const foundIds = prod_prices.map((p) => p.id);
        const missingIds = products
            .filter((p) => !foundIds.includes(p.productId))
            .map((p) => p.productId);

        throw new AppError(httpStatus.NOT_FOUND, `Products not found: ${missingIds.join(', ')}`);
    }

    //Validate charities belong to the product
    for (const payloadItem of products) {
        const dbProduct = prod_prices.find((p) => p.id === payloadItem.productId)!;

        const allowedCharityIds = dbProduct.charities.map((c) => c.charityId);

        if (!allowedCharityIds.length) continue;

        // ✅ At least 1 charity required if have At least 1 charity to the product
        if (!payloadItem.charities?.length) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `At least one charity is required for product ${payloadItem.productId}`
            );
        }

        // ✅ All provided charities must exist in the product
        const invalidCharities = payloadItem.charities.filter(
            (id) => !allowedCharityIds.includes(id)
        );

        if (invalidCharities.length > 0) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `Invalid charities [${invalidCharities.join(', ')}] for product ${payloadItem.productId}`
            );
        }
    }

    // ✅ Validate all products belong to the same seller
    const sellerIds = [...new Set(prod_prices.map((p) => p.userId))];

    if (sellerIds.length > 1) {
        throw new AppError(httpStatus.BAD_REQUEST,
            `All products in an order must belong to the same seller`
        );
    }

    // Build order items with seller info
    const orderItems = prod_prices.map((p) => {
        const product = products.find((i) => i.productId === p.id)!;
        const total_price = p.finalPrice * (product.quantity || 0);
        const donation_percent = p.donation_percent || 0;
        const extra_donation = product.extra_donation ?? 0;

        const quantity = product.quantity || 0;

        return {
            productId: p.id,
            sellerId: p.userId,
            unitPrice: p.finalPrice,
            totalPrice: total_price + extra_donation,
            quantity,
            extra_donation,
            donation_percent,
            donation_amount: (total_price * (donation_percent / 100)) * quantity, // toatl donation, multiply by quantity
            charities: product.charities ?? [],
        };
    });

    // Calculate items total
    const itemsTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0) + Number(treeCredit || 0);

    const result = await prisma.order.create({
        data: {
            totalPrice: itemsTotal,
            treeCredit: treeCredit ?? 0,
            buyerId: userId,
            billingId: billing_details?.id,
            sellerId: orderItems[0]?.sellerId,
            items: {
                create: orderItems.map(({ charities, sellerId, ...item }) => {
                    const charityCount = charities.length;
                    const splitAmount = charityCount > 0 ? item.donation_amount / charityCount : 0;
                    const splitExtra = charityCount > 0 ? item.extra_donation / charityCount : 0;

                    const dbProduct = prod_prices.find((p) => p.id === item.productId)!;

                    const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                    return {
                        ...item,
                        ...(charityCount > 0 && {
                            donations: {
                                create: charities.map((charityId) => {
                                    const productCharity = dbProduct.charities.find(
                                        (c) => c.charityId === charityId
                                    )!;

                                    return {
                                        charityId,
                                        amount: splitAmount,
                                        percent: splitPercent,
                                        extra_money: splitExtra,
                                        total_amount: splitAmount + splitExtra,
                                        status: 'PENDING',
                                        isAnonymous: productCharity.isAnonymous,
                                    };
                                }),
                            },
                        }),
                    };
                }),
            },
        },
    });


    return result;

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