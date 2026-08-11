export const redisKey = {
    shipingRate: ({ userId, billingDetailsId, itemIds }: { userId: string, billingDetailsId: string, itemIds: string[] }) => {
        const sortedItemIds = [...itemIds].sort();
        return `shipment-rates:${userId}:${billingDetailsId}:${sortedItemIds.join(",")}`;
    }
}