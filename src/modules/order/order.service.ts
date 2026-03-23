import { Order, OrderItem } from "../../../generated/prisma/client";
import prisma from "../../shared/prisma";

const findUnpaidOrder = async (
    userId: string,
    orderItems: { productId: string; quantity: number }[]
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
                },
            },
        },
    });

    const matchedOrder = pendingOrders.find((order) => {
        // ✅ 1. Must have exact same number of items
        if (order.items.length !== orderItems.length) return false;

        // ✅ 2. Forward check — every new item exists in existing order
        const allNewItemsMatch = orderItems.every((newItem) =>
            order.items.some(
                (existingItem) =>
                    existingItem.productId === newItem.productId &&
                    existingItem.quantity === newItem.quantity
            )
        );

        // ✅ 3. Reverse check — every existing item exists in new order
        const allExistingItemsMatch = order.items.every((existingItem) =>
            orderItems.some(
                (newItem) =>
                    newItem.productId === existingItem.productId &&
                    newItem.quantity === existingItem.quantity
            )
        );

        return allNewItemsMatch && allExistingItemsMatch;
    });

    return matchedOrder ?? null;
};

const addNewOrder = async (payload: Order & { products: OrderItem[] }, userId: string) => {
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
            id: true
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

    // generate order Items
    const orderItems = prod_prices?.map(p => {
        const quantity = products?.find(i => i?.productId == p?.id)?.quantity || 0
        return {
            productId: p?.id,
            unitPrice: p?.finalPrice,
            totalPrice: p?.finalPrice * quantity,
            quantity
        }
    })

    // calculate total price
    const totalPrice = orderItems.reduce((accumulator, currentValue) => accumulator + currentValue?.totalPrice, 0);

    //checking have already unpaid order 
    const existingOrder = await findUnpaidOrder(userId, orderItems);
    if (existingOrder) {
        return existingOrder
    }

    //generate new order
    const order = await prisma.order.create({
        data: {
            totalPrice,
            userId,
            items: {
                createMany: {
                    data: orderItems
                }
            }
        }
    })

    return order

}