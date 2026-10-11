import { redisPub } from ".";
import { createHash } from "node:crypto";
const VERSION_KEY = "products:version";

export const redisKeys = {
    productVersionKey: VERSION_KEY,
    productsVersion: async () => {
        const version = (await redisPub.get(VERSION_KEY)) ?? "1";

        if (!version) {
            await redisPub.set(VERSION_KEY, "1");
        }

        return version;
    },
    userVersion: async ({ userId }: { userId: string }) => {
        const version = (await redisPub.get(`user:${userId}:version`)) ?? "1";

        if (!version) {
            await redisPub.setEx(`user:${userId}:version`, 3600, "1");
        }

        return version;
    },
    incrementProductsVersion: async () => {
        const version = await redisPub.incr(VERSION_KEY);
        return version;
    },
    incrementUserVersion: async ({ userId }: { userId: string }) => {
        const version = await redisPub.incr(`user:${userId}:version`);
        return version;
    },

    productsKey: async ({ query, userId }: { query: { [key: string]: unknown }; userId?: string }) => {

        const productVersion = await redisKeys.productsVersion();

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        const userKey = userId ? `user:${userId}` : "public";
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";

        return `products:v${productVersion}:user:${userKey}:v${userVersion}:${hash}`;
    },
    userAddressKey: ({ userId }: { userId: string }) => {
        return `user-address:${userId}`;
    },

    userCartVersion: async ({ userId }: { userId: string }) => {
        const version = (await redisPub.get(`user-cart:${userId}:version`)) ?? "1";

        if (!version) {
            await redisPub.setEx(`user-cart:${userId}:version`, 3600, "1");
        }

        return version;
    },
    userCartKey: async ({ userId }: { userId: string }) => {
        const productVersion = await redisKeys.productsVersion();
        const userCartVersion = await redisKeys.userCartVersion({ userId });

        return `cart:${userId}:pv${productVersion}:cv${userCartVersion}`;
    },
    incrementUserCartVersion: async ({ userId }: { userId: string }) => {
        const version = await redisPub.incr(`user-cart:${userId}:version`);
        return version;
    },
    userCartSpecificSellerKey: async ({ userId, sellerUserName }: { userId: string; sellerUserName: string }) => {
        const productVersion = await redisKeys.productsVersion();
        const userCartVersion = await redisKeys.userCartVersion({ userId });

        return `cart:${userId}:pv${productVersion}:cv${userCartVersion}:seller:${sellerUserName}`;
    },
    userCheckoutCartItemKey: async ({ userId, cartGroupId }: { userId: string; cartGroupId: string }) => {
        const productVersion = await redisKeys.productsVersion();
        const userCartVersion = await redisKeys.userCartVersion({ userId });

        return `cart:${userId}:pv${productVersion}:cv${userCartVersion}:checkout:${cartGroupId}`;
    },

    offerItemsKey: async ({ offerId }: { offerId: string }) => {
        const productVersion = await redisKeys.productsVersion();

        return `offer:${offerId}:pv${productVersion}`;
    },

    userFavouriteProductsKey: async ({ userId, query }: { userId: string; query: { [key: string]: unknown } }) => {
        const productVersion = await redisKeys.productsVersion();
        const userVersion = await redisKeys.userVersion({ userId });

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `favourite-products:${userId}:pv${productVersion}:v${userVersion}:${hash}`;
    },
    userFavouriteItemKey: async ({ userId, productId }: { userId: string; productId: string }) => {
        const productVersion = await redisKeys.productsVersion();
        const userVersion = await redisKeys.userVersion({ userId });

        return `favourite-item:${userId}:${productId}:pv${productVersion}:v${userVersion}`;
    },

    sellerProductsKey: async ({ sellerId, query, cUserId }: { sellerId: string; cUserId ?: string; query: { [key: string]: unknown } }) => {

        const userVersion = cUserId ? await redisKeys.userVersion({ userId: cUserId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `seller-products:${sellerId}:pv${productVersion}:uv${userVersion}:${hash}`;
    }
};