import { redisPub } from ".";
import { createHash } from "node:crypto";
const VERSION_KEY = "products:version";

export const redisKeys = {
    emailOtpKey: ({ email, userId }: { email: string; userId: string }) => {
        return `otp-email:${email}:${userId}`;
    },
    phoneOtpKey: ({ phone, userId }: { phone: string; userId: string }) => {
        return `otp-phone:${phone}:${userId}`;
    },

    productVersionKey: VERSION_KEY,
    productsVersion: async () => {
        // Initialize only if the key does not exist.
        await redisPub.set(VERSION_KEY, "1", { NX: true });

        return (await redisPub.get(VERSION_KEY))!;
    },
    userVersion: async ({ userId }: { userId: string }) => {
        const key = `buyer-products:${userId}:version`;

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true, EX: 3600 });

        return (await redisPub.get(key))!;
    },
    incrementProductsVersion: async () => {
        const version = await redisPub.incr(VERSION_KEY);
        return version;
    },
    incrementUserVersion: async ({ userId }: { userId: string }) => {
        const version = await redisPub.incr(`buyer-products:${userId}:version`);
        return version;
    },

    productsKey: async ({ query, userId }: { query: { [key: string]: unknown }; userId?: string }) => {

        const productVersion = await redisKeys.productsVersion();

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        const userKey = userId ?? "public";
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";

        return `products:pv${productVersion}:user:${userKey}:uv${userVersion}:${hash}`;
    },
    userAddressKey: ({ userId }: { userId: string }) => {
        return `user-address:${userId}`;
    },

    userCartVersion: async ({ userId }: { userId: string }) => {
        const key = `user-cart:${userId}:version`;

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true, EX: 3600 });

        return (await redisPub.get(key))!;
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

    productDetailKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();
        const usercartVersion = userId ? await redisKeys.userCartVersion({ userId }) : "public";

        return `product-detail:${productId}:pv${productVersion}:uv${userVersion}:cv${usercartVersion}`;
    },
    sellerProductsKey: async ({ sellerId, query, cUserId }: { sellerId: string; cUserId?: string; query: { [key: string]: unknown } }) => {

        const userVersion = cUserId ? await redisKeys.userVersion({ userId: cUserId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        const userCartVersion = cUserId ? await redisKeys.userCartVersion({ userId: cUserId }) : "public";

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `seller-products:${sellerId}:pv${productVersion}:uv${userVersion}:cv${userCartVersion}:${hash}`;
    },

    smilarProductsOnSellerKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        return `seller-similar-products:${productId}:pv${productVersion}:uv${userVersion}`;

    },
    similarCategoryProductsKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        return `category-similar-products:${productId}:pv${productVersion}:uv${userVersion}`;
    },
    similarColorProductsKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        return `color-similar-products:${productId}:pv${productVersion}:uv${userVersion}`;
    },
    productStatsKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        return `product-stats:${productId}:pv${productVersion}:uv${userVersion}`;
    },
    recentViewedProductsKey: async ({ userId, viewKey }: { userId?: string, viewKey: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        return `recent-viewed-products:${userId}:${viewKey}:pv${productVersion}:uv${userVersion}`;
    },
    trendingProductsKey: async ({ userId }: { userId?: string }) => {
        const productVersion = await redisKeys.productsVersion();

        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";

        return `trending-products:pv${productVersion}:uv${userVersion}`;
    },
    authenticProductsKey: async ({ userId, query }: { userId?: string; query: { [key: string]: unknown } }) => {
        const productVersion = await redisKeys.productsVersion();
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `authentic-products:pv${productVersion}:uv${userVersion}:${hash}`;
    },
    productCharitiesKey: async ({ productId }: { productId: string }) => {
        const productVersion = await redisKeys.productsVersion();

        return `product-charities:${productId}:pv${productVersion}`;
    },



    // ==================USER=====================
    notificationVersionKey: async ({ userId }: { userId: string }) => {
        const key = `notification:${userId}:version`;

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true, EX: 3600 });

        return (await redisPub.get(key))!;
    },
    incrementNotificationVersion: async ({ userId }: { userId: string }) => {
        const version = await redisPub.incr(`notification:${userId}:version`);
        return version;
    },
    notificationsKey: async ({ userId, query }: { userId: string, query: { [key: string]: unknown } }) => {

        const notificationVersion = await redisKeys.notificationVersionKey({ userId });

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `notifications:${userId}:v${notificationVersion}:${hash}`;
    },
    notificationUnreadCountKey: async ({ userId }: { userId: string }) => {
        const notificationVersion = await redisKeys.notificationVersionKey({ userId });
        return `notification-unread-count:${userId}:v${notificationVersion}`;
    },

    bundleDiscountTiersKey: async ({ sellerId }: { sellerId: string }) => {
        return `bundle-discount-tiers:${sellerId}`;
    },
    badgesStatsUserKey: async ({ userId }: { userId: string }) => {
        return `badge-stats:${userId}`;
    },
    badgesUserKey: async ({ userId }: { userId: string }) => {
        return `badges:${userId}`;
    },


    // ==========================Attributes=========================
    categoriesKey: async () => {
        return `categories:all`;
    },
    categoriesVersionKey: async () => {
        const key = "categories:version";

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true });

        return (await redisPub.get(key))!;
    },
    incrementCategoriesVersion: async () => {
        const version = await redisPub.incr(`categories:version`);
        return version;
    },
    sizesVersionKey: async () => {
        const key = "sizes:version";

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true });

        return (await redisPub.get(key))!;
    },
    incrementSizesVersion: async () => {
        return redisPub.incr("sizes:version");
    },
    sizesKey: async ({ categoryId }: { categoryId?: string }) => {
        const version = await redisKeys.sizesVersionKey();
        return `sizes:v${version}:${categoryId || "all"}`;
    },
    categoryParentsKey: async ({ categoryId }: { categoryId: string }) => {
        const version = await redisKeys.categoriesVersionKey();
        return `category-parents:${categoryId}:v${version}`;
    },
    categoryChildrensKey: async ({ categoryId }: { categoryId: string }) => {
        const version = await redisKeys.categoriesVersionKey();
        return `category-children:${categoryId}:v${version}`;
    },


    sellCountriesVersionKey: async () => {
        const key = "sell-countries:version";

        // Initialize only if the key does not exist.
        await redisPub.set(key, "1", { NX: true });

        return (await redisPub.get(key))!;
    },
    incrementSellCountriesVersion: async () => {
        const version = await redisPub.incr(`sell-countries:version`);
        return version;
    },
    sellCountriesKey: async () => {
        const version = await redisKeys.sellCountriesVersionKey();
        return `sell-countries:v${version}`;
    },
    sellCountryByCodeKey: async ({ code }: { code: string }) => {
        const version = await redisKeys.sellCountriesVersionKey();
        return `sell-country:${code}:v${version}`;
    }

};