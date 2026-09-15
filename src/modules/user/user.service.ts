import { BillingDetails, Prisma, User } from "../../../generated/prisma/client";
import { Approval_Status, BadgeRole, Role } from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import httpStatus from 'http-status'

// update user profile
const updateProfile = async (payload: User & { charityImgs: { url: string, key: string }[], dltGalleries: string[] }, userId: string, image?: { url: string, key: string }) => {

    const { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken, bio, vacationMode, support_email, dltGalleries = [], charityImgs = [] } = payload

    const updateFields: Partial<User> = { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken, bio, vacationMode, support_email };

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof User] === undefined || updateFields[key as keyof User] === null) {
            delete updateFields[key as keyof User];
        }
    });

    // check updated field found or not
    if (Object.keys(updateFields).length === 0 && !image) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid field found',
        );
    }

    const data: any = {
        ...updateFields,
    };

    if (image) {
        data.picture = {
            upsert: {
                update: image,   // update existing picture
                create: image    // create new picture if not exists
            }
        };
    }

    const result = await prisma.user.update({
        where: { id: userId }, data: {
            charityGalleries: {
                ...(dltGalleries.length > 0 ? {
                    deleteMany: {
                        id: { in: dltGalleries }
                    },
                } : {}),
                ...(charityImgs.length > 0 ? {
                    createMany: {
                        data: charityImgs.map((img) => ({
                            url: img.url,
                            key: img.key
                        }))
                    }
                } : {})
            },
            ...data
        }
    })

    return result
}

//get all users
const allUsers = async (query: Record<string, unknown>, options: TPaginationOptions) => {

    const AndConditions: Prisma.UserWhereInput[] = [{ isDeleted: false, auth: { role: { not: Role.ADMIN } } }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, role } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    fname: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    phone: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                }
            ],
        });
    }

    if (role) {
        AndConditions.push({
            auth: {
                role
            }
        });
    }

    const whereConditions: Prisma.UserWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            auth: { select: { status: true } },
            picture: true,
        },
    })

    const total = await prisma.user.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
}

const getUserById = async (id: string) => {
    const result = await prisma.user.findFirst({
        where: { id }, include: {
            picture: true, charityGalleries: true, auth: {
                select: {
                    role: true,
                }
            }
        }
    });
    return result;
};

//user status update
const status_update_user = async (payload: { status: boolean }, id: string) => {

    const result = await prisma.user.update({
        where: {
            id,
            auth: { role: { not: Role.ADMIN } }
        },
        data: {
            auth: { update: { data: { status: payload?.status } } }
        }
    })

    return result
}

const deletemyAccount = async (userId: string) => {

    const exist = await prisma.user.findFirst({ where: { id: userId } });

    if (!exist) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User not found',
        );
    }

    const res = await prisma.user.update({
        where: { id: userId, auth: { role: { not: Role.ADMIN } } },
        data: { isDeleted: true }
    });

    return res;
}

const userDetails = async (userName: string, currentUserId?: string) => {

    const res = await prisma.user.findFirst({
        where: { userName: userName },
        include: {
            picture: true,
            auth: { select: { role: true } },
            _count: {
                select: {
                    followers: true,
                    following: true,
                }
            }
        },
    });

    const ratingAvg = await prisma.rating.aggregate({
        where: { toUserId: res?.id },
        _avg: { rating: true },
        _count: {
            id: true
        }
    });

    const isfolowing = await prisma.follow.findFirst({ where: { followerId: currentUserId, followingId: res?.id } })

    const totalSellDonation = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID", orderItem: {
                order: {
                    sellerId: currentUserId
                }
            }
        }, _sum: { amount: true }
    });

    const totalTreeDonation = await prisma.order.aggregate({
        where: {
            buyerId: currentUserId, status: "COMPLETED"
        }, _sum: { treeCredit: true }
    });

    const directMoneyDonation = await prisma.directDonation.aggregate({
        where: {
            payment: {
                status: "SUCCESSED"
            },
            donorId: currentUserId
        }, _sum: { amount: true }
    });

    const totalSellDonationAmount = totalSellDonation?._sum?.amount || 0;
    const totalTreeDonationAmount = totalTreeDonation?._sum?.treeCredit || 0;
    const totalDirectDonationAmount = directMoneyDonation?._sum?.amount || 0;

    const totalDonation = totalSellDonationAmount + totalTreeDonationAmount + totalDirectDonationAmount;

    const isCurrentUser = currentUserId === res?.id;

    const badges = await prisma.userBadge.findMany({
        where: {
            userId: res?.id,
            isCompleted: true
        },
        include: {
            badge: true
        }
    });

    return { user: res, review: ratingAvg, isfolowing: isfolowing ? true : false, totalDonation, isCurrentUser, badges, };
}

const charityAbout = async (userName: string) => {

    const res = await prisma.user.findFirst({
        where: { userName: userName },
        select: {
            description: true,
            charityGalleries: true,
            website: true,
            facebook: true,
            instagram: true,
            twitter: true,
            support_email: true,
        },
    })

    return res;
}

const UpdateNotification = async (payload: { status: boolean, fcmToken?: string }, userId: string) => {

    const res = await prisma.user.update({
        where: { id: userId },
        data: {
            notification: payload?.status,
            fcmToken: payload?.fcmToken
        }
    });
    return res;

}

const allCharies = async () => {
    const res = await prisma.user.findMany({
        where: {
            auth: {
                role: {
                    in: [Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP]
                },
                isverified: true,
                approval_status: Approval_Status.Approved
            }
        },
        select: {
            userName: true,
            fname: true,
            lname: true,
            email: true,
            phone: true,
            id: true,
            picture: true
        }

    })
    return res;
}

const memberStats = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        return {
            totalProducts: 0,
            totalSold: 0,
            totalFollowers: 0,
            totalDonation: 0,
        }
    }

    const totalProducts = await prisma.product.count({ where: { userId: user?.id, isDeleted: false } });

    const totalSold = await prisma.orderItem.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
            order: {
                status: "COMPLETED",
                sellerId: user.id
            }
        },
    });

    const totalFollowers = await prisma.follow.count({ where: { followingId: user?.id } });

    const totalSellDonation = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID", orderItem: {
                order: {
                    sellerId: user?.id
                }
            }
        }, _sum: { amount: true }
    });

    const totalTreeDonation = await prisma.order.aggregate({
        where: {
            buyerId: user?.id, status: "COMPLETED"
        }, _sum: { treeCredit: true }
    });

    const directMoneyDonation = await prisma.directDonation.aggregate({
        where: {
            payment: {
                status: "SUCCESSED"
            },
            donorId: user?.id
        }, _sum: { amount: true }
    });

    const totalSellDonationAmount = totalSellDonation?._sum?.amount || 0;
    const totalTreeDonationAmount = totalTreeDonation?._sum?.treeCredit || 0;
    const totalDirectDonationAmount = directMoneyDonation?._sum?.amount || 0;


    return {
        totalProducts,
        totalSold: totalSold?._sum?.quantity || 0,
        totalFollowers,
        totalDonation: totalSellDonationAmount + totalTreeDonationAmount + totalDirectDonationAmount,
    };

}

const charityStats = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName, auth: { role: { in: [Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP] } } } });

    if (!user) {
        return {
            totalFollowers: 0,
            totalFollowings: 0,
            totalDonation: 0
        }
    }

    const totalFollowers = await prisma.follow.count({ where: { followingId: user?.id } });
    const totalFollowings = await prisma.follow.count({ where: { followerId: user?.id } });

    const totalSellDonationReceived = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID",
            charityId: user?.id,
        }, _sum: { amount: true }
    });

    const directMoneyDonationReceived = await prisma.directDonation.aggregate({
        where: {
            payment: {
                status: "SUCCESSED"
            },
            charityId: user?.id
        }, _sum: { amount: true }
    });


    const totalSellDonationAmount = totalSellDonationReceived?._sum?.amount || 0;
    const totalDirectDonationAmount = directMoneyDonationReceived?._sum?.amount || 0;


    return {
        totalFollowers,
        totalFollowings,
        totalDonation: totalSellDonationAmount + totalDirectDonationAmount,
    };

}

const addOrUpdateBillingDetails = async (payload: BillingDetails, userId: string) => {

    const shipPayload = {
        "line_1": payload?.address1,
        "city": payload?.city,
        "state": payload?.state,
        "postal_code": payload?.zip_code,
        "country_alpha2": payload?.countryCode
    }

    const rateRes = await fetch(`${config.easyship.easyship_base_url}/addresses/validations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => null);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Invalid Shipping Address',
        );
    }

    const existBuyingAddress = await prisma.billingDetails.findFirst({
        where: { userId },
        include: {
            orders: {
                select: {
                    id: true
                }
            },
            ordersAsDestination: {
                select: {
                    id: true
                }
            }
        }
    });

    await prisma.$transaction(async (tx) => {

        if (existBuyingAddress && existBuyingAddress?.orders?.length === 0 && existBuyingAddress?.ordersAsDestination?.length === 0 && !existBuyingAddress?.sellerId) {

            await tx.billingDetails.update({
                where: { userId }, data: {
                    ...payload,
                    userId
                }
            });

            return;
        }
        //if just a address is exist, just soft delete the address
        else if (existBuyingAddress) {

            await tx.billingDetails.update({
                where: { userId }, data: {
                    userId: null
                }
            });
        }

        const existSellingAddress = await tx.billingDetails.findFirst({ where: { sellerId: userId } });

        const res = await tx.billingDetails.create({
            data: {
                ...payload,
                userId,
                ...(!existSellingAddress ? { sellerId: userId } : { userId: null })
            }
        })
    })

    return;
}

const addressesByUser = async (userId: string) => {
    const buyingAddress = await prisma.billingDetails.findFirst({ where: { userId } });

    const sellingAddress = await prisma.billingDetails.findFirst({ where: { sellerId: userId } });

    return {
        buyingAddress,
        sellingAddress
    }
}

const addOrUpdateSellerAddress = async (payload: BillingDetails, sellerId: string) => {

    const shipPayload = {
        "line_1": payload?.address1,
        "city": payload?.city,
        "state": payload?.state,
        "postal_code": payload?.zip_code,
        "country_alpha2": payload?.countryCode
    }

    const addressRes = await fetch(`${config.easyship.easyship_base_url}/addresses/validations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!addressRes.ok) {
        const errorData = await addressRes.json().catch(() => null);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Invalid Shipping Address',
        );
    }

    const existSellingAddress = await prisma.billingDetails.findFirst({
        where: { sellerId },
        include: {
            orders: {
                select: {
                    id: true
                }
            },
            ordersAsDestination: {
                select: {
                    id: true
                }
            }
        }
    });

    // Check if the existing address is exist & did not used in any order & did not used in any buyer address, if yes then can update the existing address, otherwise create new address

    await prisma.$transaction(async (tx) => {

        if (existSellingAddress && existSellingAddress?.orders?.length === 0 && existSellingAddress?.ordersAsDestination?.length === 0 && !existSellingAddress?.userId) {

            await tx.billingDetails.update({
                where: { sellerId }, data: {
                    ...payload,
                    sellerId
                }
            });

            return;
        }
        //if just a address is exist, just soft delete the address
        else if (existSellingAddress) {

            await tx.billingDetails.update({
                where: { sellerId }, data: {
                    sellerId: null
                }
            });
        }

        const existBuyingAddress = await tx.billingDetails.findFirst({ where: { userId: sellerId } });

        const res = await tx.billingDetails.create({
            data: {
                ...payload,
                sellerId,
                ...(!existBuyingAddress ? { userId: sellerId } : { userId: null })
            }
        })
    })


    return;
}

const bundleDiscount = async (userId: string) => {
    const res = await prisma.bundleDiscount.findFirst({ where: { sellerId: userId }, include: { tiers: true } });

    if (!res) {
        return {
            enabled: false,
            tiers: []
        }
    }
    return res;
}

const updateBundleDiscount = async (
    userId: string,
    payload: { enabled: boolean; tiers: { quantity: number; percent: number }[] }
) => {

    const res = await prisma.$transaction(async (tx) => {
        const bundleDiscount = await tx.bundleDiscount.upsert({
            where: { sellerId: userId },
            create: { sellerId: userId, enabled: payload.enabled },
            update: { enabled: payload.enabled },
        });

        await tx.bundleDiscountTier.deleteMany({
            where: { bundleDiscountId: bundleDiscount.id },
        });

        await tx.bundleDiscountTier.createMany({
            data: payload.tiers.map((tier) => ({
                bundleDiscountId: bundleDiscount.id,
                itemCount: tier.quantity,
                discountPercent: tier.percent,
            })),
        });

        return bundleDiscount;
    });

    return res;
};

const getSellerBundileTiers = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does not exist")
    }

    const res = await prisma.bundleDiscount.findFirst({ where: { sellerId: user.id }, include: { tiers: true } });

    return res;

}

const badgeStats = async (userId: string, role: string) => {

    const badge_role: BadgeRole = role == "CHARITY_SHOP" ? BadgeRole.CHARITY_SHOP : role == "CHARITABLE_ORGANIZATION" ? BadgeRole.CHARITABLE_ORGANIZATION : role == "ECO_FRIENDLY_STORE" ? BadgeRole.ECO_FRIENDLY : BadgeRole.GENERAL;

    const all_badges = await prisma.badge.findMany({
        where: {
            role: badge_role
        }
    });

    const current_availableBadges = await prisma.userBadge.findMany({
        where: {
            userId,
        }
    });

    // return all badges with current progress combined by mapping the current available badges with progress to the all badges and return the result

    const result = all_badges ? all_badges.map((badge) => {
        const currentBadge = current_availableBadges.find((userBadge) => userBadge.badgeId === badge.id);
        return {
            ...badge,
            progress: currentBadge ? currentBadge.progress : 0,
            isCompleted: currentBadge ? currentBadge.isCompleted : false,
        };
    }) : [];

    return result;
}

const userFolowings = async (userName: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const user = await prisma.user.findFirst({ where: { userName }, select: { id: true } });

    if (!user) {
        return null;
    }

    const result = await prisma.follow.findMany({
        where: { followerId: user?.id },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            following: {
                include: {
                    picture: true,
                    auth: {
                        select: { role: true }
                    },
                    _count: {
                        select: {
                            products: {
                                where: { isDeleted: false, stock: { gt: 0 } }
                            }
                        }
                    }
                }
            }
        }
    });

    const total = await prisma.follow.count({
        where: { followerId: user?.id },
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
}

const userFolowers = async (userName: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const user = await prisma.user.findFirst({ where: { userName }, select: { id: true } });

    if (!user) {
        return null;
    }

    const result = await prisma.follow.findMany({
        where: { followingId: user?.id },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            follower: {
                include: {
                    picture: true,
                    auth: {
                        select: { role: true }
                    },
                    _count: {
                        select: {
                            products: {
                                where: { isDeleted: false, stock: { gt: 0 } }
                            }
                        }
                    }
                }
            }
        }
    });

    const total = await prisma.follow.count({
        where: { followingId: user?.id },
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
}


export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    status_update_user,
    deletemyAccount,
    userDetails,
    UpdateNotification,

    userFolowings,
    userFolowers,
    allCharies,
    addOrUpdateBillingDetails,
    addressesByUser,
    addOrUpdateSellerAddress,
    memberStats,
    charityStats,
    charityAbout,
    bundleDiscount,
    updateBundleDiscount,
    getSellerBundileTiers,
    badgeStats
}