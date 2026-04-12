import { Order, OrderItem } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { DistributePaymentQueue } from "../../queues/payment.queue";
import prisma from "../../shared/prisma";
import httpStatus from "http-status"

const findUnpaidOrder = async (
    userId: string,
    orderItems: { productId: string; quantity: number, extra_donation: number, charities: string[] }[],
    treeCredit: number
) => {
    const pendingOrders = await prisma.order.findMany({
        where: {
            userId,
            status: 'PENDING',
            payment: {
                status: {
                    notIn: ['PROCESSING', 'SUCCESSED'],
                },
            },
            // ✅ at least one item matches — just to narrow results
            sellerGroups: {
                some: {
                    items: {
                        some: {
                            productId: { in: orderItems.map((i) => i.productId) },
                        },
                    },
                },
            },
        },
        include: {
            sellerGroups: {
                include: {
                    items: {
                        select: {
                            productId: true,
                            quantity: true,
                            extra_donation: true,
                            donations: true,
                        },
                    },
                },
            },
        },
    });

    const isSameItem = (
        a: { productId: string; quantity: number; extra_donation: number; donations: { charityId: string }[] },
        b: { productId: string; quantity: number; extra_donation: number; charities: string[] }
    ): boolean => {
        if (a.productId !== b.productId) return false;
        if (a.quantity !== b.quantity) return false;
        if (a.extra_donation !== b.extra_donation) return false;

        const existingCharityIds = a.donations.map((d) => d.charityId);
        if (existingCharityIds.length !== b.charities.length) return false;

        const sortedExisting = [...existingCharityIds].sort();
        const sortedNew = [...b.charities].sort();

        return sortedExisting.every((id, index) => id === sortedNew[index]);
    };

    const matchedOrder = pendingOrders.find((order) => {

        // ✅ Check treeCredit matches
        if (order.treeCredit !== treeCredit) return false;

        // Flatten all items across all seller groups
        const allExistingItems = order.sellerGroups.flatMap((g) => g.items);

        if (allExistingItems.length !== orderItems.length) return false;

        const allNewItemsMatch = orderItems.every((newItem) =>
            allExistingItems.some((existingItem) => isSameItem(existingItem, newItem))
        );

        const allExistingItemsMatch = allExistingItems.every((existingItem) =>
            orderItems.some((newItem) => isSameItem(existingItem, newItem))
        );

        return allNewItemsMatch && allExistingItemsMatch;
    });

    return matchedOrder ?? null;
};

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
            userId: true,
            donation_percent: true
        }
    })

    // Validate all products exist
    if (prod_prices.length !== products.length) {
        const foundIds = prod_prices.map((p) => p.id);
        const missingIds = products
            .filter((p) => !foundIds.includes(p.productId))
            .map((p) => p.productId);

        throw new Error(`Products not found: ${missingIds.join(', ')}`);
    }

    //Validate charities belong to the product
    for (const payloadItem of products) {
        const dbProduct = prod_prices.find((p) => p.id === payloadItem.productId)!;

        const allowedCharityIds = dbProduct.charities.map((c) => c.charityId);

        if (!allowedCharityIds.length) continue;

        // ✅ At least 1 charity required if have At least 1 charity to the product
        if (!payloadItem.charities?.length) {
            throw new Error(
                `At least one charity is required for product ${payloadItem.productId}`
            );
        }

        // ✅ All provided charities must exist in the product
        const invalidCharities = payloadItem.charities.filter(
            (id) => !allowedCharityIds.includes(id)
        );

        if (invalidCharities.length > 0) {
            throw new Error(
                `Invalid charities [${invalidCharities.join(', ')}] for product ${payloadItem.productId}`
            );
        }
    }

    // Build order items with seller info
    const orderItems = prod_prices.map((p) => {
        const product = products.find((i) => i.productId === p.id)!;
        const total_price = p.finalPrice * (product.quantity || 0);
        const donation_percent = p.donation_percent || 0;
        const extra_donation = product.extra_donation ?? 0

        return {
            productId: p.id,
            sellerId: p.userId, // for grouping
            unitPrice: p.finalPrice,
            totalPrice: total_price + extra_donation,
            quantity: product.quantity || 0,
            extra_donation,
            donation_percent,
            donation_amount: total_price * (donation_percent / 100),
            charities: product.charities ?? [],
        };
    });

    // Group items by seller
    const groupedBySeller = orderItems.reduce<Record<string, typeof orderItems>>(
        (acc, item) => {
            if (!acc[item.sellerId]) acc[item.sellerId] = [];
            acc[item.sellerId].push(item);
            return acc;
        },
        {}
    );

    // Calculate items total
    const itemsTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0) + Number(treeCredit || 0);
    

    //checking have already unpaid order 
    const existingOrder = await findUnpaidOrder(userId, orderItems, (payload?.treeCredit || 0));
    if (existingOrder) {
        return existingOrder
    }

    const result = await prisma.order.create({
        data: {
            totalPrice: itemsTotal,
            treeCredit: treeCredit ?? 0,
            userId,
            status: 'PENDING',
            billingId: billing_details?.id,
            sellerGroups: {
                create: Object.entries(groupedBySeller).map(([sellerId, items]) => {
                    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

                    return {
                        sellerId,
                        subtotal,
                        delivery: {
                            create: {
                                totalItems: items?.length,
                                totalWeight: 0,

                                //for now, will dynmic
                                baseCharge: 0,
                                finalCharge: 0,
                                discount: 0,
                                status: "UNPAID"
                            }
                        },
                        items: {
                            create: items.map(({ charities, sellerId: _sellerId, ...item }) => {
                                const charityCount = charities.length;
                                const splitAmount = charityCount > 0 ? item.donation_amount / charityCount : 0;
                                const splitExtra = charityCount > 0 ? item.extra_donation / charityCount : 0;

                                const dbProduct = prod_prices.find((p) => p.id === item.productId)!;

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
                                                    percent: item.donation_percent,
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
                    };
                }),
            },
        },
    });


    return result;

}

const confirmOrderReceived = async (orderId: string, userId: string) => {
    //check exist order received
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found")
    }

    //check order is delivered or not
    if (order?.status !== "DELIVERED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Request Invalid")
    }

    //mark order received
    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "COMPLETED"
        }
    })

    // distribute the payment
    await DistributePaymentQueue.add(
        "distribute-payment",
        { orderId },
        {
            jobId: order?.id,
            removeOnComplete: true,
        }
    );



}

export const orderService = {
    addNewOrder
}