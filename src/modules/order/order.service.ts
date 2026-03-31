import { Order, OrderItem } from "../../../generated/prisma/client";
import prisma from "../../shared/prisma";

const findUnpaidOrder = async (
    userId: string,
    orderItems: { productId: string; quantity: number, extra_donation: number, charities: string[] }[]
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
            items: {
                some: {
                    productId: { in: orderItems.map((i) => i.productId) },
                },
            },
        },
        include: {
            items: {
                select: {
                    productId: true,
                    quantity: true,
                    extra_donation: true,
                    donations: true
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

        // Extract charityIds from nested donations relation
        const existingCharityIds = a.donations.map((d) => d.charityId);

        if (existingCharityIds.length !== b.charities.length) return false;

        // Sort both before comparing
        const sortedExisting = [...existingCharityIds].sort();
        const sortedNew = [...b.charities].sort();

        return sortedExisting.every((id, index) => id === sortedNew[index]);
    };

    const matchedOrder = pendingOrders.find((order) => {
        if (order.items.length !== orderItems.length) return false;

        const allNewItemsMatch = orderItems.every((newItem) =>
            order.items.some((existingItem) => isSameItem(existingItem, newItem))
        );

        const allExistingItemsMatch = order.items.every((existingItem) =>
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
    const { products } = payload;

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

    // generate order Items
    const orderItems = prod_prices?.map(p => {
        const product = products?.find(i => i?.productId == p?.id)
        const total_price = p?.finalPrice * (product?.quantity || 0);
        const donation_percent = product?.donation_percent || 0
        return {
            productId: p?.id,
            unitPrice: p?.finalPrice,
            totalPrice: total_price,
            quantity: (product?.quantity || 0),
            extra_donation: product?.extra_donation ?? 0,
            donation_percent,
            donation_amount: total_price * (donation_percent / 100),
            charities: product?.charities ?? []
        }
    })

    // calculate total price for all items
    const totalPrice = orderItems.reduce((accumulator, currentValue) => accumulator + currentValue?.totalPrice, 0);

    //checking have already unpaid order 
    const existingOrder = await findUnpaidOrder(userId, orderItems);
    if (existingOrder) {
        return existingOrder
    }

    const result = await prisma.order.create({
        data: {
            totalPrice,
            userId,
            status: 'PENDING',
            items: {
                create: orderItems.map(({ charities, ...item }) => {
                    const charityCount = charities.length;
                    const splitAmount = item.donation_amount / charityCount;
                    const splitExtra = item.extra_donation / charityCount;

                    // Get the db product to access isAnonymous per charity
                    const dbProduct = prod_prices.find(
                        (p) => p.id === item.productId
                    )!;

                    return {
                        ...item,
                        donations: {
                            create: charities.map((charityId) => {

                                // ✅ Get isAnonymous from ProductCharity
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
                                }

                            }),
                        },
                    };
                }),
            },
        },
    });


    return result

}

export const orderService = {
    addNewOrder
}