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
        const version = (await redisPub.get(VERSION_KEY)) ?? "1";

        if (!version) {
            await redisPub.set(VERSION_KEY, "1");
        }

        return version;
    },
    userVersion: async ({ userId }: { userId: string }) => {
        const version = (await redisPub.get(`buyer-products:${userId}:version`)) ?? "1";

        if (!version) {
            await redisPub.setEx(`buyer-products:${userId}:version`, 3600, "1");
        }

        return version;
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

    productDetailKey: async ({ productId, userId }: { productId: string; userId?: string }) => {
        const userVersion = userId ? await redisKeys.userVersion({ userId }) : "public";
        const productVersion = await redisKeys.productsVersion();
        const usercartVersion = userId ? await redisKeys.userCartVersion({ userId }) : "public";

        return `product-detail:${productId}:pv${productVersion}:uv${userVersion}:cv${usercartVersion}`;
    },
    sellerProductsKey: async ({ sellerId, query, cUserId }: { sellerId: string; cUserId?: string; query: { [key: string]: unknown } }) => {

        const userVersion = cUserId ? await redisKeys.userVersion({ userId: cUserId }) : "public";
        const productVersion = await redisKeys.productsVersion();

        const hash = createHash("sha1")
            .update(JSON.stringify(query))
            .digest("hex")
            .slice(0, 24);

        return `seller-products:${sellerId}:pv${productVersion}:uv${userVersion}:${hash}`;
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
        const version = (await redisPub.get(`notification:${userId}:version`)) ?? "1";

        if (!version) {
            await redisPub.setEx(`notification:${userId}:version`, 3600, "1");
        }

        return version;
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


    // ==========================Attributes=========================
    categoriesKey: async () => {
        return `categories:all`;
    },
    categoriesVersionKey: async () => {
        const version = (await redisPub.get(`categories:version`)) ?? "1";

        if (!version) {
            await redisPub.setEx(`categories:version`, 3600, "1");
        }
        return version;
    },
    incrementCategoriesVersion: async () => {
        const version = await redisPub.incr(`categories:version`);
        return version;
    },
    categoryParentsKey: async ({ categoryId }: { categoryId: string }) => {
        const version = await redisKeys.categoriesVersionKey();
        return `category-parents:${categoryId}:v${version}`;
    },
    categoryChildrensKey: async ({ categoryId }: { categoryId: string }) => {
        const version = await redisKeys.categoriesVersionKey();
        return `category-children:${categoryId}:v${version}`;
    }
};