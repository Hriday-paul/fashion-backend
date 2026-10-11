import { jobs } from './../../queues/jobs.name';
import { BadgeGenerateQueue } from './../../queues/badge.queue';
import { Request } from "express";
import { Approval_Status, Prisma, Product, Role } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { redisPub } from "../../redis";
import prisma from "../../shared/prisma";
import { categoryService } from "../category/category.service";
import httpStatus from "http-status";
import { BuildFingerPrint } from "../../utils/BuildfingerPrint";
import { chatService } from "../chat/chat.service";
import { SendMessageHandle, UpdateMessageHandle } from "../../socket/handlers/MessageHandler";
import moment from "moment";
import { notificationQueue, priceDropNotificationQueue } from "../../queues/notificaion.queue";
import { redisKeys } from '../../redis/keys';

type ProductOtherPayload = {
    images: { key: string, url: string }[],
    charities: string[],
    donationPrivacy: boolean,
}

const addNewProduct = async (payload: Product & ProductOtherPayload, role: string, userId: string) => {

    const { images, charities, donationPrivacy, createdAt, updatedAt, catagory_hierarchy, finalPrice, discountPct, price, ...morePayload } = payload;

    //charity required for all roles, without eco friendly store and charity shop and charitable organization

    const non_req_charity_roles: string[] = [Role.ECO_FRIENDLY_STORE, Role.CHARITY_SHOP];
    const isAllowCharity = !non_req_charity_roles.includes(role);

    if (isAllowCharity && (!charities || charities?.length === 0 || morePayload?.donation_percent < 5)) {

        throw new AppError(httpStatus.BAD_REQUEST, "Minimum donation percentage and charity is required");
    }

    const category = await categoryService.haveChildCategory(payload?.categoryId);
    //checking catalog is avaialable or not
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Selected catalog doesn't exist")
    }
    //checking have child category
    if (category?.children && category?.children?.length > 0) {
        throw new AppError(httpStatus.CONFLICT, "Please, select next catalog")
    }

    //get category hierarchy list
    const categories = await categoryService.getParentChain({ categoryId: payload?.categoryId });
    const hierarchy = categories.map(cat => cat?.id);

    // check payload charities exact charity or not
    if (charities?.length > 0) {
        const CHARITY_ROLES = [
            Role.CHARITY_SHOP,
            Role.CHARITABLE_ORGANIZATION,
        ];
        const charityIds = charities;
        const validCharities = await prisma.auth.findMany({
            where: {
                userId: { in: charityIds },
                role: { in: CHARITY_ROLES },
                isDeleted: false,
                status: true,
                approval_status: Approval_Status.Approved
            },
            select: { userId: true, role: true },
        });

        const validIds = new Set(validCharities.map((a) => a.userId));
        const invalidIds = charityIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
            throw new Error(
                `The following IDs are not a Charity Shop or Charitable Organization: ${invalidIds.join(", ")}`
            );
        }
    }

    const finalcharities = isAllowCharity ? charities?.map(i => ({ charityId: i, isAnonymous: donationPrivacy ? true : false })) : [];

    //calculate price
    const lastPrice = price - (price * (discountPct / 100));

    // const checking shipment from is exist or not the seller
    const seller = await prisma.user.findFirst({
        where: {
            id: userId,
        },
        select: {
            sellerAddress: true
        }
    });

    if (!seller?.sellerAddress) {
        throw new AppError(httpStatus.BAD_REQUEST, "Please, add your shipment address first")
    }

    const res = await prisma.product.create({
        data: {
            images: { create: images },
            charities: { create: finalcharities },
            ...morePayload,
            donationAnonymous: donationPrivacy,
            price,
            discountPct,
            finalPrice: lastPrice,
            stock: 1,
            catagory_hierarchy: hierarchy,
            userId
        }
    });

    //check badge
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "STYLE_STARTER", userId });

    //dlt cache
    await redisKeys.incrementUserVersion({ userId });

    return res;
}

const allProducts = async (query: Record<string, unknown>, options: TPaginationOptions, userId?: string) => {

    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, stock, authenticate, ...moreFields } = query;

    const cacheQuery: { [key: string]: unknown } = { limit, skip, sortBy, sortOrder, page };

    if (searchTerm) {
        const tokens = (searchTerm as string).trim().toLowerCase().split(/\s+/).filter(Boolean);
        cacheQuery.searchTerm = tokens.sort();

        tokens.forEach((token) => {
            AndConditions.push({
                OR: [
                    { brand: { name: { contains: token, mode: "insensitive" } } },
                    { size: { title: { contains: token, mode: "insensitive" } } },
                    { title: { contains: token, mode: "insensitive" } },
                    { description: { contains: token, mode: "insensitive" } },
                    { tags: { hasSome: [token] } },
                    { catagory_hierarchy: { hasSome: [token] } }, // এটা যোগ করুন
                ],
            });
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
        cacheQuery.category = category;
    }

    if (brands) {
        const splitBrand = (brands as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.brands = splitBrand;
        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.sizes = splitSize;
        AndConditions.push({
            sizeId: {
                in: splitSize
            }
        });
    }

    if (conditions) {
        const splitCondition = (conditions as string).toLowerCase().split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.conditions = splitCondition;
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
    }
    if (colors) {
        const splitColors = (colors as string).toLowerCase().split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.colors = splitColors;
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
    }
    if (meterials) {
        const splitMeterials = (meterials as string).toLowerCase().split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.meterials = splitMeterials;
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
    }

    if (stock && stock === "sold") {
        cacheQuery.stock = "sold";
        AndConditions.push({
            stock: {
                lte: 0
            }
        });
    } else if (stock && stock !== "all") {
        cacheQuery.stock = "available";
        AndConditions.push({
            stock: {
                gte: 1
            }
        });
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            finalPrice: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
        cacheQuery.minPrice = minPrice ? Number(minPrice) : undefined;
        cacheQuery.maxPrice = maxPrice ? Number(maxPrice) : undefined;
    }

    if (authenticate && authenticate === "true") {
        AndConditions.push({
            assistentSell: {}
        })
        cacheQuery.authenticate = "true";
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            if (value !== undefined && value !== null) {
                AndConditions.push({
                    [field]: {
                        equals: value,
                    },
                });
                cacheQuery[field] = value;
            }
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    // Generate a cache key based on the query
    const cacheKey = await redisKeys.productsKey({ query: cacheQuery, userId });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    // If no cached data, fetch from the database
    const response = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            images: {
                take: 1,
                orderBy: {
                    order: "asc"
                }
            },
            brand: true,
            size: true,
            _count: {
                select: {
                    favourites: true
                }
            },
            user: {
                select: {
                    userName: true,
                }
            },
            // is Favourites by user
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    const result = {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: response,
    };

    // Cache the result
    await redisPub.set(cacheKey, JSON.stringify(result), {
        EX: 60 * 10, // Cache for 10 minutes
    });

    return result;

}

const productsByUserId = async (query: Record<string, unknown>, options: TPaginationOptions, userId: string, currentUser?: string) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }, { userId }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, showItemInCart, stock, authenticate, ...moreFields } = query;

    const cacheQuery: { [key: string]: unknown } = { limit, skip, sortBy, sortOrder, page };

    if (searchTerm) {

        const tokens = (searchTerm as string).trim().toLowerCase().split(/\s+/).filter(Boolean);
        cacheQuery.searchTerm = tokens.sort();

        tokens.forEach((token) => {
            AndConditions.push({
                OR: [
                    { brand: { name: { contains: token, mode: "insensitive" } } },
                    { size: { title: { contains: token, mode: "insensitive" } } },
                    { title: { contains: token, mode: "insensitive" } },
                    { description: { contains: token, mode: "insensitive" } },
                    { tags: { hasSome: [token] } },
                ],
            });
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
        cacheQuery.category = category;
    }

    if (brands) {
        const splitBrand = (brands as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        cacheQuery.brands = splitBrand;

        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
        cacheQuery.brands = splitBrand;
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        AndConditions.push({
            sizeId: {
                in: splitSize,
            }
        });
        cacheQuery.sizes = splitSize;
    }

    if (conditions) {
        const splitCondition = (conditions as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
        cacheQuery.conditions = splitCondition;
    }
    if (colors) {
        const splitColors = (colors as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
        cacheQuery.colors = splitColors;
    }
    if (meterials) {
        const splitMeterials = (meterials as string).split(",").map((s) => s.trim()).filter(Boolean).sort();
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
        cacheQuery.meterials = splitMeterials;
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            finalPrice: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
        cacheQuery.minPrice = minPrice ? Number(minPrice) : undefined;
        cacheQuery.maxPrice = maxPrice ? Number(maxPrice) : undefined;
    }

    if (stock && stock === "sold") {
        cacheQuery.stock = "sold";
        AndConditions.push({
            stock: {
                lte: 0
            }
        });
    } else if (stock && stock !== "on-sale") {
        cacheQuery.stock = "available";
        AndConditions.push({
            stock: {
                gte: 1
            }
        });
    }

    if (authenticate && authenticate === "true") {
        cacheQuery.authenticate = "true";
        AndConditions.push({
            assistentSell: {}
        })
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            if (value !== undefined && value !== null) {
                AndConditions.push({
                    [field]: {
                        equals: value,
                    },
                });
                cacheQuery[field] = value;
            }
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const cacheKey = await redisKeys.sellerProductsKey({ query: cacheQuery, sellerId: userId, cUserId: currentUser });
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const result = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            images: {
                take: 2,
                orderBy: {
                    order: "asc"
                },
                select: {
                    url: true,
                    id: true
                }
            },
            brand: true,
            size: true,
            category: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                },
            },
            //favourite count
            _count: {
                select: {
                    favourites: true,
                    cartItems: true,
                    offerItems: true
                }
            },
            // is Favourites by user
            favourites: currentUser
                ? {
                    where: {
                        userId: currentUser,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
            ...(showItemInCart ? {

                cartItems: currentUser ? {
                    where: {
                        group: {
                            userId: currentUser
                        }
                    }
                } : false

            } : {})
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    const res = {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };

    //set on redis cache
    await redisPub.setEx(cacheKey, 60 * 10, JSON.stringify(res)); //10 minutes cache

    return res;

}

const productsByUserName = async (query: Record<string, unknown>, options: TPaginationOptions, userName: string, currentUser?: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        return { data: [] }
    }

    const result = await productsByUserId(query, options, user?.id, currentUser);

    return result;

}

const similarProductsFromSeller = async (productId: string, currentUser?: string) => {

    const product = await prisma.product.findFirst({
        where: { id: productId },
        select: { userId: true, user: { select: { userName: true } }, categoryId: true, brandId: true }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const similarProducts = await prisma.product.findMany({
        where: {
            userId: product.userId,
            id: { not: productId },
            isDeleted: false,
            stock: { gt: 0 }
        },
        take: 30,
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            title: true,
            finalPrice: true,
            price: true,
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
                select: {
                    url: true
                }
            },
            brand: {
                select: {
                    name: true
                }
            },
            size: {
                select: {
                    title: true
                }
            },

            //favourite count
            _count: {
                select: {
                    favourites: true
                }
            },
            // is Favourites by user
            favourites: currentUser ? {
                where: {
                    userId: currentUser,
                },
                select: {
                    id: true,
                },
            } : false,

        }
    });

    const isOwner = currentUser === product.userId;

    return {
        isOwner,
        sellerUserName: product?.user?.userName,
        products: similarProducts
    };
}

const sameCategoryProducts = async (productId: string, currentUser?: string) => {

    const product = await prisma.product.findFirst({
        where: { id: productId },
        select: { categoryId: true, category: { select: { name: true } }, userId: true }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product doesn't exist");
    }

    const similarProducts = await prisma.product.findMany({
        where: {
            id: { not: productId },
            categoryId: product?.categoryId,
            isDeleted: false,
            stock: { gt: 0 }
        },
        take: 30,
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            title: true,
            finalPrice: true,
            price: true,
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
            brand: {
                select: {
                    name: true
                }
            },
            size: {
                select: {
                    title: true
                }
            },

            //favourite count
            _count: {
                select: {
                    favourites: true
                }
            },
            // is Favourites by user
            favourites: currentUser ? {
                where: {
                    userId: currentUser,
                },
                select: {
                    id: true,
                },
            } : false,

        }
    });

    const isOwner = currentUser === product.userId;

    return {
        isOwner,
        categoryId: product?.categoryId,
        categoryName: product?.category?.name,
        products: similarProducts
    };
}

const sameColorProducts = async (productId: string, currentUser?: string) => {

    const product = await prisma.product.findFirst({
        where: { id: productId },
        select: { color: true, userId: true }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product doesn't exist");
    }

    const similarProducts = await prisma.product.findMany({
        where: {
            id: { not: productId },
            color: product?.color,
            isDeleted: false,
            stock: { gt: 0 }
        },
        take: 30,
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            title: true,
            finalPrice: true,
            price: true,
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
            brand: {
                select: {
                    name: true
                }
            },
            size: {
                select: {
                    title: true
                }
            },

            //favourite count
            _count: {
                select: {
                    favourites: true
                }
            },
            // is Favourites by user
            favourites: currentUser ? {
                where: {
                    userId: currentUser,
                },
                select: {
                    id: true,
                },
            } : false,

        }
    });

    const isOwner = currentUser === product.userId;

    return {
        isOwner,
        color: product?.color,
        products: similarProducts
    };
}

const newArrivalProducts = async () => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }, { stock: { gt: 0 } }];

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.product.findMany({
        where: whereConditions,
        take: 10,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
        },
    })

    return result;

}

async function getViewKey(req: Request, productId?: string) {

    // Guest — build fingerprint
    const fingerprint = BuildFingerPrint(req);

    return {
        productKey: `view:guest:${fingerprint}:${productId}`,
        userkey: `view:guest:${fingerprint}`
    };
}

const productDetails = async (productId: string, req: Request, userId?: string) => {

    const details = await prisma.product.findFirst({
        where: {
            id: productId
        },
        include: {
            category: true,
            brand: true,
            size: true,
            images: true,
            charities: {
                include: {
                    charity: {
                        select: {
                            id: true,
                            fname: true,
                            lname: true,
                            userName: true,
                            picture: {
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            user: {
                select: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: {
                        select: {
                            url: true
                        }
                    },
                    _count: {
                        select: {
                            products: {
                                where: {
                                    stock: { gt: 0 },
                                    isDeleted: false
                                }
                            }
                        }
                    },
                    userName: true,
                    avgRating: true,
                    email: true,
                    phone: true,
                    ratingsReceived: {

                    }
                },

            },
            _count: {
                select: {
                    cartItems: {
                        where: {
                            group: {
                                userId: userId
                            }
                        }
                    },
                }
            },
            // Add this 👇
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
        }
    });

    if (!details) {
        return null
    }

    const { productKey: viewKey, userkey } = await getViewKey(req, productId);

    // SET only if NOT exists, auto-expire after 1 hour
    const isNew = await redisPub.set(viewKey, 1, {
        EX: 3600,  // expire after 1 hour
        NX: true   // only set if NOT exists
    });

    if (isNew) {
        // Insert in DB as product views
        await prisma.productView.create({
            data: {
                productKey: viewKey,
                userkey,
                productId,
                userId
            }
        })
    }

    const sizechart = await prisma.size.findMany({
        where: {
            sizeCategoryHierarchyGroups: {
                some: {
                    categoryId: details?.categoryId
                }
            }
        }
    })

    return { ...details, sizechart, isMyProduct: userId === details?.userId };
    // return details;
}

const productStats = async (productId: string, currentUserId?: string) => {

    const stats = await prisma.product.findFirst({
        where: { id: productId, },
        select: {
            _count: {
                select: {
                    favourites: true,
                    cartItems: currentUserId ? {
                        where: {
                            group: {
                                NOT: {
                                    userId: currentUserId
                                }
                            }
                        }
                    } : true,
                    offerItems: currentUserId ? {
                        where: {
                            offer: {
                                NOT: {
                                    buyerId: currentUserId
                                }
                            }
                        }
                    } : true,
                }
            }
        }
    })

    return stats;
}

const recentViewProducts = async (viewKey: string, currentUserId?: string) => {
    const products = await prisma.productView.findMany({
        where: {
            userkey: viewKey,
        },
        distinct: "productId",
        take: 20,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            product: {
                include: {
                    images: {
                        orderBy: {
                            order: "asc"
                        },
                        take: 1,
                    },
                    _count: {
                        select: {
                            favourites: true
                        }
                    },
                    brand: true,
                    size: true,
                    favourites: currentUserId
                        ? {
                            where: {
                                userId: currentUserId,
                            },
                            select: {
                                id: true,
                            },
                        }
                        : false,
                },
            }
        }
    })

    return products;
}

const trendingProducts = async (userId?: string) => {
    const since = moment().subtract(7, 'days').toDate(); // last 7 days

    const [views, orders, wishlists, offers] = await Promise.all([
        // views in last 7 days
        prisma.productView.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since }, product: { isDeleted: false, stock: { gt: 0 } } },
            _count: { productId: true },
        }),
        // orders in last 7 days
        prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                createdAt: { gte: since }, product: { isDeleted: false, stock: { gt: 0 } }
            },
            _count: { productId: true }
        }),
        // wishlists in last 7 days
        prisma.favourite.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since }, product: { isDeleted: false, stock: { gt: 0 } } },
            _count: { productId: true }
        }),
        // offers in last 7 days
        prisma.offerItem.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since }, product: { isDeleted: false, stock: { gt: 0 } } },
            _count: { productId: true }
        })
    ])

    // build score map
    const scoreMap: Record<string, number> = {}

    const WEIGHTS = {
        view: 1.5,
        order: 3,   // orders matter most
        wishlist: 2,
        offer: 2.5
    }

    views.forEach(v => {
        scoreMap[v.productId] = (scoreMap[v.productId] ?? 0) + v._count.productId * WEIGHTS.view
    })
    orders.forEach(o => {
        scoreMap[o.productId] = (scoreMap[o.productId] ?? 0) + o._count.productId * WEIGHTS.order
    })
    wishlists.forEach(w => {
        scoreMap[w.productId] = (scoreMap[w.productId] ?? 0) + w._count.productId * WEIGHTS.wishlist
    })
    offers.forEach(o => {
        scoreMap[o.productId] = (scoreMap[o.productId] ?? 0) + o._count.productId * WEIGHTS.offer
    })

    // sort by score and get top 12
    const trendingIds = Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([productId]) => productId)

    // fetch full product data
    const trendingProducts = await prisma.product.findMany({
        where: { id: { in: trendingIds } },
        take: 12,
        include: {
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
            brand: true,
            size: true,
            category: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                },
            },
            _count: {
                select: {
                    favourites: true
                }
            },
            // Add this 👇
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
        }
    })

    // preserve score order
    const sorted = trendingIds
        .map(id => trendingProducts.find(p => p.id === id))
        .filter((p): p is (typeof trendingProducts)[number] => p !== undefined)

    return sorted;
}

const topSellingProducts = async (userId?: string) => {

    const products = await prisma.product.findMany({
        where: {
            orderItems: {
                some: {
                    order: {
                        status: "COMPLETED"
                    }
                }
            },
            isDeleted: false
        },
        orderBy: {
            orderItems: { _count: 'desc' }  // sort by number of order items
        },
        take: 12,
        include: {
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
            brand: true,
            size: true,
            category: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                },
            },
            _count: {
                select: {
                    favourites: true
                }
            },
            // Add this 👇
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
        }
    })

    return products;
}

const recomendedProducts = async (viewKey: string, userId?: string) => {

    // 1. Get recent viewed product IDs (last 10)
    const recentViews = await prisma.productView.findMany({
        where: {
            userkey: viewKey,
        },
        distinct: "productId",
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
        select: { productId: true },
    });

    // 2. Get wishlist product IDs (authenticated only)
    const wishlistItems = userId
        ? await prisma.favourite.findMany({
            where: { userId },
            select: { productId: true },
        })
        : [];

    const viewedIds = recentViews.map((v) => v.productId);
    const wishlistIds = wishlistItems.map((w) => w.productId);

    // combine all interacted product IDs
    const interactedIds = [...new Set([...viewedIds, ...wishlistIds])];

    if (interactedIds.length === 0) {
        // Cold start — return popular/featured products
        return trendingProducts(userId)
    }

    // 3. Get categories & tags from interacted products
    const interactedProducts = await prisma.product.findMany({
        where: { id: { in: interactedIds } },
        select: { categoryId: true, tags: true, brandId: true },
    });

    const categoryIds = [...new Set(interactedProducts.map((p) => p.categoryId))];
    const brandIds = [...new Set(interactedProducts.map((p) => p.brandId))];
    const tags = [...new Set(interactedProducts.flatMap((p) => p.tags))];

    // 4. Find similar products — exclude already interacted ones
    const recommended = await prisma.product.findMany({
        where: {
            id: { notIn: interactedIds },   // exclude seen/wishlisted
            OR: [
                { categoryId: { in: categoryIds } },  // same category
                { tags: { hasSome: tags } },    // matching tags
                { brandId: { in: brandIds } },    // matching brands
            ],
        },
        orderBy: [
            { favourites: { _count: 'desc' } },       // most wishlisted first
            { viewers: { _count: 'desc' } },       // most viewed second
        ],
        take: 8,
        include: {
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
            },
            brand: true,
            size: true,
            category: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                },
            },
            _count: {
                select: {
                    favourites: true
                }
            },
            // Add this 👇
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                } : false
        }
    });

    return recommended;

}

const authenticateProducts = async (options: TPaginationOptions, userId?: string) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);


    const result = await prisma.product.findMany({
        where: {
            assistentSell: {},
            isDeleted: false,
            stock: { gt: 0 }
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            images: {
                take: 1,
                orderBy: {
                    order: "asc"
                }
            },
            brand: true,
            size: true,
            category: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                },
            },
            //favourite count
            _count: {
                select: {
                    favourites: true
                }
            },
            // is Favourites by user
            favourites: userId
                ? {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                }
                : false,
        },
    })

    const total = await prisma.product.count({
        where: {
            isDeleted: false,
            stock: { gt: 0 },
            assistentSell: {}
        },
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };
}

const donationSupportByProduct = async (productId: string) => {

    const donations = await prisma.product.findFirst({
        where: {
            id: productId
        },
        select: {
            charities: {
                select: {
                    charity: {
                        select: {
                            fname: true,
                            lname: true,
                            userName: true,
                            picture: {
                                select: {
                                    url: true
                                }
                            },
                            bio: true,
                            description: true,
                        }
                    }
                }
            },
            donation_percent: true,
            finalPrice: true,
        }
    })

    return {
        charities: donations?.charities || [],
        donation_percent: donations?.donation_percent || 0,
        donation_amount: donations?.finalPrice ? (donations.finalPrice * (donations.donation_percent / 100)) : 0
    };

}

const dropPriceForAProduct = async (payload: { productId: string, newPrice: number }, currentUser: { id: string, userName: string, role: string }) => {

    const { productId, newPrice } = payload;

    const { id: currentUserId, userName: currentUserName } = currentUser;

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            isDeleted: false
        }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    if (product.userId !== currentUserId && currentUser.role !== Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to drop the price of this product");
    }

    if (product?.stock <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product is out of stock");
    }

    if (newPrice >= product.finalPrice) {
        throw new AppError(httpStatus.BAD_REQUEST, "New price must be less than the current price");
    }

    const percentageDrop = Number(
        (((product.price - newPrice) / product.price) * 100).toFixed(2)
    );

    const updatedProduct = await prisma.product.update({
        where: {
            id: productId
        },
        data: {
            finalPrice: newPrice,
            discountPct: percentageDrop,
        }
    });

    //send notification
    priceDropNotificationQueue.add(jobs.priceDropNotification, {
        productId: updatedProduct.id,
        sellerId: updatedProduct.userId,
    });

    return null;

}

const makeAnOfferAsBuyer = async (payload: { productIds: string[], offerPrice: number, sellerId: string }, currentUser: { id: string, userName: string }) => {

    const { id: currentUserId, userName: currentUserName } = currentUser;

    const { productIds, offerPrice, sellerId } = payload;

    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            isDeleted: false,
            stock: { gt: 0 },
            userId: { not: currentUserId, equals: sellerId }
        },
        select: {
            finalPrice: true,
            id: true,
            userId: true,
            images: {
                orderBy: {
                    order: "asc"
                },
                take: 1,
                select: {
                    url: true
                }
            }
        }
    });

    if (products.length !== productIds.length) {
        throw new AppError(httpStatus.NOT_FOUND, "Some items doesn't exist");
    }

    const receiver = await prisma.user.findFirst({ where: { id: sellerId, auth: { isverified: true, status: true } }, select: { userName: true, fcmToken: true, id: true } });

    if (!receiver) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller Does not exist");
    }

    const chat = await chatService.createChat({ currentUserId: currentUserId, user2Id: sellerId });

    const result = await prisma.$transaction(async (tx) => {

        const offer = await tx.offer.create({
            data: {
                buyerId: currentUserId,
                sellerId,
                offeredPrice: offerPrice,
                actualPrice: products.reduce((sum, p) => sum + p.finalPrice, 0),
                offerItems: {
                    create: products.map(p => ({
                        productId: p?.id,
                        quantity: 1
                    }))
                },
                sendByBuyer: true,
                status: "PENDING"
            }
        });

        const msg = await tx.message.create({
            data: {
                receiverId: sellerId,
                senderId: currentUserId,
                offerId: offer?.id,
                chatId: chat?.id
            },
            include: {
                files: true,
                sender: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                offer: {
                    include: {
                        offerItems: {
                            select: {
                                id: true,
                                product: {
                                    select: {
                                        finalPrice: true,
                                        stock: true,
                                        id: true,
                                        title: true,
                                        images: {
                                            take: 1,
                                            select: {
                                                id: true,
                                                url: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        seller: {
                            select: {
                                userName: true,
                                picture: {
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return { msg, offer };
    })

    //send a message about the offer
    SendMessageHandle((global as any).socketio, result?.msg, () => { });

    const isbundle = products.length > 1;

    //send notification to the seller about the offer
    await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: `**${currentUserName}** sent you ${isbundle ? 'a bundle' : 'an'} offer`,
            message: `**${currentUserName}** sent you ${isbundle ? 'a bundle' : 'an'} offer to purchase your items.`,
            actorId: currentUserId,
            receiverId: receiver?.id,
            entityId: currentUserName,
            entityType: "OFFER",
            entityImgs: products?.map(p => p?.images[0]?.url),
            type: "OFFER_RECEIVED",
            fcmToken: receiver?.fcmToken,
            groupKeyId: result?.offer?.id,
        }
    })

    return;
}

const acceptOfferAsSeller = async (offerId: string, currentUser: { id: string, userName: string }) => {

    const { id: currentUserId, userName: currentUserName } = currentUser;

    const offer = await prisma.offer.findFirst({
        where: {
            id: offerId,
        },
        include: {
            offerItems: {
                select: {
                    productId: true,
                    product: {
                        select: {
                            images: {
                                take: 1,
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            buyer: {
                select: {
                    fcmToken: true
                }
            }
        }
    });

    if (!offer) {
        throw new AppError(httpStatus.NOT_FOUND, "Offer does not exist");
    }

    if (offer.sellerId !== currentUserId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to accept this offer");
    }

    const items = await prisma.product.findMany({
        where: {
            id: { in: offer?.offerItems?.map(item => item.productId) },
            isDeleted: false,
            stock: { gt: 0 }
        },
        select: {
            id: true,
            finalPrice: true
        }
    });

    if (items.length !== offer?.offerItems?.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "Some items are no longer available");
    }

    const updatedOffer = await prisma.offer.update({
        where: {
            id: offerId
        },
        data: {
            status: "ACCEPTED",
            actionAt: new Date(),
            expiredAt: moment().add(24, 'hours').toDate() // set expiration time to 24 hours from now
        }
    });

    const msg = await prisma.message.findFirst({
        where: {
            offerId: updatedOffer.id
        },
        include: {
            files: true,
            sender: {
                select: {
                    id: true,
                    picture: {
                        select: {
                            url: true
                        }
                    },
                    userName: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    picture: {
                        select: {
                            url: true
                        }
                    },
                    userName: true
                }
            },
            offer: {
                include: {
                    offerItems: {
                        select: {
                            id: true,
                            product: {
                                select: {
                                    finalPrice: true,
                                    stock: true,
                                    id: true,
                                    title: true,
                                    images: {
                                        take: 1,
                                        select: {
                                            id: true,
                                            url: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    seller: {
                        select: {
                            userName: true,
                            picture: {
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (msg) {
        UpdateMessageHandle((global as any).socketio, msg, () => { })
    }

    //send notification to the buyer about the offer
    await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: `Offer accepted.`,
            message: `Your placed offer has been accepted! Complete the purchase within 24 hours, as the accepted offer will expire after 24 hours.`,
            actorId: currentUserId,
            receiverId: offer?.buyerId,
            entityId: currentUserName,
            entityType: "OFFER",
            entityImgs: offer?.offerItems?.map(i => i?.product?.images[0]?.url),
            type: "OFFER_ACCEPTED",
            fcmToken: offer?.buyer?.fcmToken,
            groupKeyId: offer?.id,
        }
    })

    return;

}

const declineCounterOfferAsSeller = async (payload: { offerId: string, offerPrice: number }, currentUser: { id: string, userName: string }) => {

    const { offerId, offerPrice } = payload;
    const { id: currentUserId, userName: currentUserName } = currentUser;

    const offer = await prisma.offer.findFirst({
        where: {
            id: offerId,
        },
        select: {
            id: true,
            buyerId: true,
            sellerId: true,
            offerItems: {
                select: {
                    product: {
                        select: {
                            finalPrice: true,
                            id: true,
                            images: {
                                take: 1,
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            buyer: {
                select: {
                    fcmToken: true
                }
            }
        }
    });

    if (!offer) {
        throw new AppError(httpStatus.NOT_FOUND, "Offer does not exist");
    }

    if (offer.sellerId !== currentUserId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to accept this offer");
    }

    const items = await prisma.product.findMany({
        where: {
            id: { in: offer?.offerItems?.map(item => item.product.id) },
            isDeleted: false,
            stock: { gt: 0 }
        },
        select: {
            id: true,
            finalPrice: true
        }
    });

    if (items.length !== offer?.offerItems?.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "Some items are no longer available");
    }

    const chat = await chatService.createChat({ currentUserId: offer?.sellerId, user2Id: offer?.buyerId });

    const result = await prisma.$transaction(async (tx) => {

        // Reject the existing offer
        const rejectedOffer = await tx.offer.update({
            where: {
                id: offerId
            },
            data: {
                status: "REJECTED"
            }
        });

        // Create a new offer with the counter offer price
        const newOffer = await tx.offer.create({
            data: {
                buyerId: offer.buyerId,
                sellerId: offer.sellerId,
                offeredPrice: offerPrice,
                actualPrice: items?.reduce((sum, p) => sum + p.finalPrice, 0),
                offerItems: {
                    create: items?.map(p => ({
                        productId: p?.id,
                        quantity: 1
                    }))
                },
                expiredAt: moment().add(24, 'hours').toDate(), // set expiration time to 24 hours from now
                sendByBuyer: false,
                status: "ACCEPTED"
            }
        });

        // Create a message to notify the buyer about the counter offer
        const msg = await tx.message.create({
            data: {
                receiverId: offer?.buyerId,
                senderId: offer?.sellerId,
                offerId: newOffer?.id,
                chatId: chat?.id
            },
            include: {
                files: true,
                sender: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                offer: {
                    include: {
                        offerItems: {
                            select: {
                                id: true,
                                product: {
                                    select: {
                                        finalPrice: true,
                                        stock: true,
                                        id: true,
                                        title: true,
                                        images: {
                                            take: 1,
                                            select: {
                                                id: true,
                                                url: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        seller: {
                            select: {
                                userName: true,
                                picture: {
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return { newMsg: msg, rejectedOffer, newOffer };

    })

    //sending socket message to buyer about old offer rejection
    if (result?.rejectedOffer) {
        const oldMsg = await prisma.message.findFirst({
            where: {
                offerId: result?.rejectedOffer.id
            },
            include: {
                files: true,
                sender: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        picture: {
                            select: {
                                url: true
                            }
                        },
                        userName: true
                    }
                },
                offer: {
                    include: {
                        offerItems: {
                            select: {
                                id: true,
                                product: {
                                    select: {
                                        finalPrice: true,
                                        stock: true,
                                        id: true,
                                        title: true,
                                        images: {
                                            take: 1,
                                            select: {
                                                id: true,
                                                url: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        seller: {
                            select: {
                                userName: true,
                                picture: {
                                    select: {
                                        url: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if (oldMsg) {
            UpdateMessageHandle((global as any).socketio, oldMsg, () => { })
        }
    }

    //sending socket message to buyer about new offer
    SendMessageHandle((global as any).socketio, result?.newMsg, () => { })

    //send notification to the buyer about the offer
    await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: `**${currentUserName}** sent you a counter offer`,
            message: `**${currentUserName}** sent you a counter offer after reviewing your offer.`,
            actorId: currentUserId,
            receiverId: offer?.buyerId,
            entityId: currentUserName,
            entityType: "OFFER",
            entityImgs: offer?.offerItems?.map(i => i?.product?.images[0]?.url),
            type: "OFFER_RECEIVED",
            fcmToken: offer?.buyer?.fcmToken,
            groupKeyId: offer?.id
        }
    })

    return;
}

const dltAProduct = async (productId: string, currentUser: { id: string, userName: string, role: string }) => {
    const { id: currentUserId, userName: currentUserName } = currentUser;

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            isDeleted: false
        }
    });
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    //check if the product belongs to the current user
    if (product.userId !== currentUserId && currentUser.role !== Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to delete this listing");
    }

    await prisma.product.update({
        where: {
            id: productId
        },
        data: {
            isDeleted: true
        }
    });
}

export const productService = {
    addNewProduct,

    allProducts,
    authenticateProducts,
    newArrivalProducts,
    productDetails,

    productsByUserName,
    productsByUserId,
    dltAProduct,

    getViewKey,

    recentViewProducts,
    trendingProducts,
    topSellingProducts,
    recomendedProducts,
    similarProductsFromSeller,
    donationSupportByProduct,
    sameCategoryProducts,
    sameColorProducts,
    productStats,
    dropPriceForAProduct,

    makeAnOfferAsBuyer,
    acceptOfferAsSeller,
    declineCounterOfferAsSeller
}