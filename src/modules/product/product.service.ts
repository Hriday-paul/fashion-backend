import { Request } from "express";
import { Approval_Status, Prisma, Product, Role } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { redisPub } from "../../redis";
import prisma from "../../shared/prisma";
import { categoryService } from "../category/category.service";
import httpStatus from "http-status";
import { BuildFingerPrint } from "../../utils/BuildfingerPrint";

type ProductOtherPayload = {
    images: { key: string, url: string }[],
    charities: { isAnonymous: boolean, charityId: string, percent: number }[]
}

const addNewProduct = async (payload: Product & ProductOtherPayload, role: string, userId: string) => {

    const { images, charities, createdAt, updatedAt, catagory_hierarchy, finalPrice, discountPct, price, ...morePayload } = payload;

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
    const categories = await categoryService.getParentChain(payload?.categoryId);
    const hierarchy = categories.map(cat => cat?.id);


    const charityRoles: string[] = [Role.ECO_FRIENDLY_STORE, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP];
    const isAllowCharity = !charityRoles.includes(role);

    // check payload charities exact charity or not
    if (charities?.length > 0) {
        const CHARITY_ROLES = [
            Role.CHARITY_SHOP,
            Role.CHARITABLE_ORGANIZATION,
        ];
        const charityIds = charities?.map(c => c?.charityId);
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

    //calculate price
    const lastPrice = price - (price * (discountPct / 100));

    const res = await prisma.product.create({
        data: {
            images: { create: images },
            charities: { create: isAllowCharity ? charities : [] },
            ...morePayload,
            price,
            discountPct,
            finalPrice: lastPrice,
            catagory_hierarchy: hierarchy,
            userId
        }
    });

    return res;
}

const allProducts = async (query: Record<string, unknown>, options: TPaginationOptions, userId?: string) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }];

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
            price: {
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
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            totalPage: Math.ceil(total / limit),
            page,
            limit,
        },
        data: result,
    };

}

async function getViewKey(req: Request, productId?: string) {

    // Guest — build fingerprint
    const fingerprint = BuildFingerPrint(req);

    return {
        productKey: `view:guest:${fingerprint}:${productId}`,
        userkey: `view:guest:${fingerprint}`
    };
}

const productDetails = async (productId: string, req: Request, userId?: string,) => {

    const details = await prisma.product.findFirst({
        where: {
            id: productId
        },
        include: {
            category: true,
            brand: true,
            size: true,
            images: true,
            charities: true,
            user: {
                include: {
                    auth: {
                        select: {
                            role: true
                        }
                    },
                    picture: true
                }
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

    // const categoryChain = await categoryService.getParentChain(details?.categoryId);

    // return { ...details, cat_parent_chain: categoryChain };
    return details;
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

    // sort by score and get top 10
    const trendingIds = Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
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
            // _count: {
            //     select: {
            //         favourites: true
            //     }
            // },
            // Add this 👇
            // favourites: userId
            //     ? {
            //         where: {
            //             userId: userId,
            //         },
            //         select: {
            //             id: true,
            //         },
            //     }
            //     : false,
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
        },
        orderBy: {
            orderItems: { _count: 'desc' }  // sort by number of order items
        },
        take: 10,
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
            // _count: {
            //     select: {
            //         favourites: true
            //     }
            // },
            // Add this 👇
            // favourites: userId
            //     ? {
            //         where: {
            //             userId: userId,
            //         },
            //         select: {
            //             id: true,
            //         },
            //     }
            //     : false,
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
    })

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
        take: 10,
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
            // _count: {
            //     select: {
            //         favourites: true
            //     }
            // },
            // Add this 👇
            // favourites: userId
            //     ? {
            //         where: {
            //             userId: userId,
            //         },
            //         select: {
            //             id: true,
            //         },
            //     }
            //    
        }
    });

    return recommended;

}

export const productService = {
    addNewProduct,

    allProducts,
    productDetails,

    getViewKey,

    recentViewProducts,
    trendingProducts,
    topSellingProducts,
    recomendedProducts
}