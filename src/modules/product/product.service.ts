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

type ProductOtherPayload = {
    images: { key: string, url: string }[],
    charities: string[],
    donationPrivacy: boolean,
}

const addNewProduct = async (payload: Product & ProductOtherPayload, role: string, userId: string) => {

    const { images, charities, donationPrivacy, createdAt, updatedAt, catagory_hierarchy, finalPrice, discountPct, price, ...morePayload } = payload;

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


    const charityRoles: string[] = [Role.ECO_FRIENDLY_STORE, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP];
    const isAllowCharity = !charityRoles.includes(role);

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
            charities: { create: isAllowCharity ? finalcharities : [] },
            ...morePayload,
            price,
            discountPct,
            finalPrice: lastPrice,
            stock: 1,
            catagory_hierarchy: hierarchy,
            userId
        }
    });

    return res;
}

const allProducts = async (query: Record<string, unknown>, options: TPaginationOptions, userId?: string) => {

    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false, stock: { gt: 0 } }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, ...moreFields } = query;

    if (searchTerm) {
        AndConditions.push({
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
                    },
                },
                {
                    tags: {
                        has: searchTerm as string
                    }
                }
            ],
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
    }

    if (brands) {
        const splitBrand = (brands as string).split(",")
        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",")
        AndConditions.push({
            sizeId: {
                in: splitSize
            }
        });
    }

    if (conditions) {
        const splitCondition = (conditions as string).split(",");
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
    }
    if (colors) {
        const splitColors = (colors as string).split(",");
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
    }
    if (meterials) {
        const splitMeterials = (meterials as string).split(",");
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            finalPrice: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            AndConditions.push({
                [field]: {
                    equals: value,
                },
            });
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            images: true,
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
        where: whereConditions,
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };

}

const myProducts = async (query: Record<string, unknown>, options: TPaginationOptions, userId: string) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }, { userId }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, showItemInCart, ...moreFields } = query;

    if (searchTerm) {
        AndConditions.push({
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
                    },
                },
                {
                    tags: {
                        has: searchTerm as string
                    }
                }
            ],
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
    }

    if (brands) {
        const splitBrand = (brands as string).split(",")
        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",")
        AndConditions.push({
            sizeId: {
                in: splitSize
            }
        });
    }

    if (conditions) {
        const splitCondition = (conditions as string).split(",");
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
    }
    if (colors) {
        const splitColors = (colors as string).split(",");
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
    }
    if (meterials) {
        const splitMeterials = (meterials as string).split(",");
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            finalPrice: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            AndConditions.push({
                [field]: {
                    equals: value,
                },
            });
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: [
            // {
            //     stock: "desc"
            // },
            {
                [sortBy]: sortOrder,
            },],
        include: {
            images: {
                take: 2,
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
            }
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };

}

const productsByUserId = async (query: Record<string, unknown>, options: TPaginationOptions, userId: string, currentUser?: string) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }, { userId }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, showItemInCart, ...moreFields } = query;

    if (searchTerm) {
        AndConditions.push({
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
                    },
                },
                {
                    tags: {
                        has: searchTerm as string
                    }
                }
            ],
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
    }

    if (brands) {
        const splitBrand = (brands as string).split(",")
        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",")
        AndConditions.push({
            sizeId: {
                in: splitSize
            }
        });
    }

    if (conditions) {
        const splitCondition = (conditions as string).split(",");
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
    }
    if (colors) {
        const splitColors = (colors as string).split(",");
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
    }
    if (meterials) {
        const splitMeterials = (meterials as string).split(",");
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            finalPrice: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            AndConditions.push({
                [field]: {
                    equals: value,
                },
            });
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

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
                    favourites: true
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

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };

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
            images: true,
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
                            products: true
                        }
                    },
                    userName: true,
                    avgRating: true,
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

    return { ...details, sizechart };
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

const recentViewProducts = async (viewKey: string) => {
    const products = await prisma.productView.findMany({
        where: {
            userkey: viewKey,
        },
        distinct: "productId",
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            product: {
                include: {
                    images: true
                }
            }
        }
    })

    return products;
}

const trendingProducts = async (userId?: string) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days

    const [views, orders, wishlists] = await Promise.all([
        // views in last 7 days
        prisma.productView.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since } },
            _count: { productId: true }
        }),
        // orders in last 7 days
        prisma.orderItem.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since } },
            _count: { productId: true }
        }),
        // wishlists in last 7 days
        prisma.favourite.groupBy({
            by: ['productId'],
            where: { createdAt: { gte: since } },
            _count: { productId: true }
        }),
    ])

    // build score map
    const scoreMap: Record<string, number> = {}

    const WEIGHTS = {
        view: 1,
        order: 5,   // orders matter most
        wishlist: 3
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

    // sort by score and get top 8
    const trendingIds = Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([productId]) => productId)

    // fetch full product data
    const trendingProducts = await prisma.product.findMany({
        where: { id: { in: trendingIds } },
        include: {
            images: true,
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
    const sorted = trendingIds.map(id =>
        trendingProducts.find(p => p.id === id)
    )

    return sorted;
}

const topSellingProducts = async (userId?: string) => {

    const products = await prisma.product.findMany({
        where: {
            orderItems: {
                some: {
                    order: {
                        status: "DELIVERED"
                    }
                }
            },
            isDeleted: false
        },
        orderBy: {
            orderItems: { _count: 'desc' }  // sort by number of order items
        },
        take: 8,
        include: {
            images: true,
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
            images: true,
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

const dropPriceForAProduct = async (payload: { productId: string, newPrice: number }, currentUserId: string) => {
    const { productId, newPrice } = payload;

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            isDeleted: false
        }
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    if (product.userId !== currentUserId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to drop the price of this product");
    }

    if (product?.stock <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product is out of stock");
    }

    if (newPrice >= product.finalPrice) {
        throw new AppError(httpStatus.BAD_REQUEST, "New price must be less than the current price");
    }

    //calculate the percentage drop
    const percentageDrop = (newPrice * 100) / product.price;

    const updatedProduct = await prisma.product.update({
        where: {
            id: productId
        },
        data: {
            finalPrice: newPrice,
            discountPct: percentageDrop,
        }
    });

    return null;

}

const makeAnOfferAsBuyer = async (payload: { productIds: string[], offerPrice: number, sellerId: string }, currentUserId: string) => {

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
            id: true
        }
    });

    if (products.length !== productIds.length) {
        throw new AppError(httpStatus.NOT_FOUND, "Some items doesn't exist");
    }

    const receiver = await prisma.user.findFirst({ where: { id: sellerId, auth: { isverified: true, status: true } }, select: { userName: true } });

    if (!receiver) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller Does not exist");
    }

    const chat = await chatService.createChat({ currentUserId: currentUserId, user2Id: sellerId });

    const msg = await prisma.$transaction(async (tx) => {

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

        return msg;

    })

    SendMessageHandle((global as any).socketio, msg, () => { })

    return;
}

const acceptOfferAsSeller = async (offerId: string, currentUserId: string) => {
    const offer = await prisma.offer.findFirst({
        where: {
            id: offerId,
        },
        include: {
            offerItems: {
                select: {
                    productId: true
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

    return;

}

const declineCounterOfferAsSeller = async (payload: { offerId: string, offerPrice: number }, currentUserId: string) => {

    const { offerId, offerPrice } = payload;

    const offer = await prisma.offer.findFirst({
        where: {
            id: offerId,
        },
        select: {
            buyerId: true,
            sellerId: true,
            offerItems: {
                select: {
                    product: {
                        select: {
                            finalPrice: true,
                            id: true
                        }
                    }
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

    return;
}

export const productService = {
    addNewProduct,

    allProducts,
    newArrivalProducts,
    productDetails,

    productsByUserName,
    productsByUserId,
    myProducts,

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