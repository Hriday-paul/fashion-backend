import { BillingDetails, Prisma, User } from "../../../generated/prisma/client";
import { Approval_Status, BadgeRole, Role } from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import prisma from "../../shared/prisma";
import httpStatus from 'http-status'
import { sellCountriesService } from "../sellCountries/sellCountries.service";
import fs from 'fs';
import path from 'path';
import { emailQueue } from "../../queues/email.queue";
import { jobs } from "../../queues/jobs.name";

interface UserPayload extends User {
    charityImgs: { url: string, key: string }[],
    charityThumbnail?: { url: string, key: string },
    dltGalleries: string[],
    image?: { url: string, key: string }
}

// update user profile
const updateProfile = async (payload: UserPayload, user: { userId: string, role: string }) => {

    const { userId } = user;

    const { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken, bio, vacationMode, support_email, dltGalleries = [], charityImgs = [], charityThumbnail, image } = payload;

    const updateFields: Partial<User> = { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken, bio, vacationMode, support_email };

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof User] === undefined || updateFields[key as keyof User] === null) {
            delete updateFields[key as keyof User];
        }
    });

    // check updated field found or not
    if (Object.keys(updateFields).length === 0 && !image && !charityThumbnail && dltGalleries.length === 0 && charityImgs.length === 0) {
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

    if (charityThumbnail && charityThumbnail?.url && charityThumbnail?.key) {
        data.charityThumbnail = {
            upsert: {
                update: charityThumbnail,   // update existing thumbnail
                create: charityThumbnail    // create new thumbnail if not exists
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

const getuserIdByUserName = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName }, select: { id: true } });

    return user;
};

//get all users
const allUsers = async (query: Record<string, unknown>, options: TPaginationOptions) => {

    const AndConditions: Prisma.UserWhereInput[] = [{ isDeleted: false, auth: { role: { not: Role.ADMIN } } }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, role, status, approval_status, isverified } = query;

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

    if (status) {
        AndConditions.push({
            auth: {
                status: status === "true" ? true : false
            }
        });
    }

    if (approval_status) {
        AndConditions.push({
            auth: {
                approval_status: approval_status as Approval_Status
            }
        });
    }

    if (isverified) {
        AndConditions.push({
            auth: {
                isverified: isverified === "true" ? true : false
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
            auth: { select: { status: true, approval_status: true, isverified: true, role: true } },
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

const approveOrDeclineUser = async (payload: { approval_status: Approval_Status, userId: string }) => {

    const auth = await prisma.auth.findFirst({ where: { userId: payload.userId }, include: { user: true } });

    if (!auth) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Account does not exist',
        );
    }

    if (auth?.approval_status !== Approval_Status.Pending) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Unable to update approval status',
        );
    }

    const result = await prisma.auth.update({
        where: { userId: auth.userId },
        data: {
            approval_status: payload?.approval_status
        }
    });

    const isApproved = payload?.approval_status === Approval_Status.Approved;

    const viewDir = path.join(process.cwd(), 'public', 'view');

    const loadTemplate = (fileName: string): string =>
        fs.readFileSync(path.join(viewDir, fileName), 'utf8');

    const isCharity = auth?.role === Role.CHARITABLE_ORGANIZATION;
    const userName = auth?.user?.userName || '';

    if (isApproved) {
        const fileName = isCharity ? 'charity_approved.html' : 'account-approve.html';

        await emailQueue.add(jobs.email, {
            to: auth?.email,
            subject: 'FASH-ON - Account Approved',
            html: loadTemplate(fileName)
                .replace('{{userName}}', userName)
                .replace('{{accountUrl}}', `${config.client_Url}/member/${userName}`),
        });
    } else {
        const fileName = isCharity ? 'charity-decline.html' : 'account-decline.html';

        await emailQueue.add(jobs.email, {
            to: auth?.email,
            subject: 'FASH-ON - Account Declined',
            html: loadTemplate(fileName).replace('{{userName}}', userName),
        });
    }

    return result;
}

const getUserById = async (id: string) => {
    const result = await prisma.user.findFirst({
        where: { id }, include: {
            picture: true,
            charityGalleries: true,
            charityThumbnail: true,
            auth: {
                select: {
                    role: true,
                    isPhoneVerified: true,
                }
            }
        }
    });

    let countryAvaialblity = null;

    if (result?.country) {
        countryAvaialblity = await sellCountriesService.getCountryByCode(result?.country);
    }

    return { ...result, countryAvaialblity };
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
        where: { userName: userName, auth: { approval_status: "Approved" } },
        include: {
            picture: true,
            auth: { select: { role: true, isverified: true, isPhoneVerified: true } },
            _count: {
                select: {
                    followers: true,
                    following: true,
                }
            },
            charityGalleries: true,
        },
    });

    if (!res) {
        return {
            user: null,
            review: null,
            isfolowing: false,
            totalDonation: 0,
            isCurrentUser: false,
            badges: [],
        }
    }

    const totalSells = await prisma.orderItem.count({
        where: {
            order: {
                sellerId: res?.id,
                status: "COMPLETED",
            },
            isCancelled: false
        }
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

    let totalRaisedDonation = 0;
    if (res?.auth?.role === Role.CHARITABLE_ORGANIZATION || res?.auth?.role === Role.CHARITY_SHOP) {

        const totalSellDonation = await prisma.sellDonation.aggregate({
            where: {
                status: "PAID",
                charityId: res?.id
            }, _sum: { total_amount: true }
        });

        const directMoneyDonation = await prisma.directDonation.aggregate({
            where: {
                payment: {
                    status: "SUCCESSED"
                },
                charityId: res?.id
            }, _sum: { amount: true }
        });

        const raisedSellDonationAmount = totalSellDonation?._sum?.total_amount || 0;
        const raisedDirectDonationAmount = directMoneyDonation?._sum?.amount || 0;

        totalRaisedDonation = raisedSellDonationAmount + raisedDirectDonationAmount;
    }

    const isCurrentUser = currentUserId === res?.id;

    const badges = await userBadges(res?.id);

    let countryAvaialblity = null;

    if (res?.country) {
        countryAvaialblity = await sellCountriesService.getCountryByCode(res?.country);
    }

    return { user: res, review: ratingAvg, isfolowing: isfolowing ? true : false, totalDonation, isCurrentUser, badges, countryAvaialblity, totalSells, totalRaisedDonation };
}

const userBadges = async (userId: string) => {
    //check on redis
    const cacheKey = await redisKeys.badgesUserKey({ userId });
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    await prisma.userBadge.findMany({
        where: {
            userId: userId,
            isCompleted: true
        },
        include: {
            badge: true
        }
    });
    //set data on redis cache for future requests
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(cachedData)); // cache for 1 hour
}

const userDetailsWithbalanceAdmin = async (userName: string) => {

    const res = await prisma.user.findFirst({
        where: { userName: userName },
        include: {
            picture: true,
            auth: { select: { role: true, status: true, approval_status: true, isverified: true } },
            wallet: {
                select: {
                    balance: true
                }
            },

            account_documents : true,

            //roles
            charitableOrganization: true,
            charityShop: true,
            ecoFriendlyStore: true,
            celebrity: true,
            ambassador: true,
            professionalSeller: true,
        },
    });

    return res;

}

const sellerHubStatsForAdmin = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName }, include: { auth: { select: { role: true } } } });

    if (!user || !user?.auth?.role) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const SellDonated = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID", orderItem: {
                order: {
                    sellerId: user.id
                }
            }
        }, _sum: { amount: true }
    });

    const avaialbleListings = await prisma.product.count({ where: { userId: user.id, isDeleted: false, stock: { gt: 0 } } });

    const soldListings = await prisma.orderItem.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
            order: {
                status: "COMPLETED",
                payment: {
                    status: "SUCCESSED"
                },
                sellerId: user.id
            }
        },
    });

    const runningOrders = await prisma.order.count({
        where: {
            sellerId: user.id,
            status: {
                notIn: ["COMPLETED", "CANCELLED"]
            },
            payment: {
                status: "SUCCESSED"
            }
        }
    });

    const cancelledOrders = await prisma.order.count({
        where: {
            sellerId: user.id,
            status: "CANCELLED",
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const completedOrders = await prisma.order.count({
        where: {
            sellerId: user.id,
            status: "COMPLETED",
            payment: {
                status: "SUCCESSED"
            }
        }
    });

    const returnedOrders = await prisma.return.count({
        where: {
            sellerId: user.id,
            status: "COMPLETED"
        }
    });

    return {
        totalSellDonation: SellDonated?._sum?.amount || 0,
        avaialbleListings,
        soldListings: soldListings?._sum?.quantity || 0,
        runningOrders,
        cancelledOrders,
        completedOrders,
        returnedOrders
    }

}

const buyerHubStatsForAdmin = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName }, include: { auth: { select: { role: true } } } });

    if (!user || !user?.auth?.role) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const totalTreeDonation = await prisma.order.aggregate({
        where: {
            buyerId: user?.id,
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

    const extraMoneyDonation = await prisma.sellDonation.aggregate({
        where: {
            orderItem: {
                order: {
                    buyerId: user?.id,
                    payment: {
                        status: "SUCCESSED"
                    }
                }
            }
        }, _sum: { extra_money: true }
    });

    const runningOrders = await prisma.order.count({
        where: {
            buyerId: user.id,
            status: {
                notIn: ["COMPLETED", "CANCELLED"]
            },
            payment: {
                status: "SUCCESSED"
            }
        }
    });

    const cancelledOrders = await prisma.order.count({
        where: {
            buyerId: user.id,
            status: "CANCELLED",
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const returnedOrders = await prisma.return.count({
        where: {
            buyerId: user.id,
            status: "COMPLETED"
        }
    });

    return {
        totalTreeDonation: totalTreeDonation?._sum?.treeCredit || 0,
        directMoneyDonation: directMoneyDonation?._sum?.amount || 0,
        extraMoneyDonation: extraMoneyDonation?._sum?.extra_money || 0,
        runningOrders: runningOrders || 0,
        cancelledOrders: cancelledOrders || 0,
        returnedOrders: returnedOrders || 0
    }

}

const charityAbout = async (userName: string) => {

    const res = await prisma.user.findFirst({
        where: { userName: userName },
        select: {
            id: true,
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
            picture: true,
            charityThumbnail: true,
            auth: {
                select: {
                    role: true
                }
            }
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

    const addressRes = await fetch(`${config.easyship.easyship_prod_base_url}/addresses/validations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_prod_api_key}`,
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

        //if just a address is exist, just soft delete the address
        if (existBuyingAddress) {

            await tx.billingDetails.update({
                where: { userId }, data: {
                    userId: null
                }
            });
        }

        const res = await tx.billingDetails.create({
            data: {
                ...payload,
                userId,
                sellerId: null
            }
        })
    })

    //dlt the cache for user address
    const cacheKey = redisKeys.userAddressKey({ userId });
    await redisPub.del(cacheKey);

    return;
}

const addressesByUser = async (userId: string): Promise<{ buyingAddress: BillingDetails | null; sellingAddress: BillingDetails | null }> => {

    //lookup on cache
    const cacheKey = redisKeys.userAddressKey({ userId });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const buyingAddress = await prisma.billingDetails.findFirst({ where: { userId } });

    const sellingAddress = await prisma.billingDetails.findFirst({ where: { sellerId: userId } });

    const result = {
        buyingAddress,
        sellingAddress
    }

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

    return result;
}

const addOrUpdateSellerAddress = async (payload: BillingDetails, sellerId: string) => {

    const countryCode = payload?.countryCode?.toUpperCase();

    //check the shipment country is available or not for selling
    const country = await sellCountriesService.getCountryByCode(countryCode);

    if (!country) {
        throw new AppError(httpStatus.BAD_REQUEST, "Selling is not available in your country, will be available soon.");
    }

    const shipPayload = {
        "line_1": payload?.address1,
        "city": payload?.city,
        "state": payload?.state,
        "postal_code": payload?.zip_code,
        "country_alpha2": payload?.countryCode
    }

    const addressRes = await fetch(`${config.easyship.easyship_prod_base_url}/addresses/validations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_prod_api_key}`,
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

    await prisma.$transaction(async (tx) => {

        //if just a address is exist, just soft delete the address
        if (existSellingAddress) {

            await tx.billingDetails.update({
                where: { sellerId }, data: {
                    sellerId: null
                }
            });
        }

        //create new address
        const res = await tx.billingDetails.create({
            data: {
                ...payload,
                sellerId,
                userId: null
            }
        })
    })

    //dlt the cache for user address
    const cacheKey = redisKeys.userAddressKey({ userId: sellerId });
    await redisPub.del(cacheKey);

    return;
}

const bundleDiscount = async (userId: string) => {

    const cacheKey = await redisKeys.bundleDiscountTiersKey({ sellerId: userId });
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const res = await prisma.bundleDiscount.findFirst({ where: { sellerId: userId }, include: { tiers: true } });

    const result = res || { enabled: false, tiers: [] };

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

    return result;
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

    //invalidate cache
    const cacheKey = await redisKeys.bundleDiscountTiersKey({ sellerId: userId });
    await redisPub.del(cacheKey);

    return res;
};

const getSellerBundileTiers = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does not exist")
    }

    //lookup on cache
    const cacheKey = await redisKeys.bundleDiscountTiersKey({ sellerId: user.id });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const res = await prisma.bundleDiscount.findFirst({ where: { sellerId: user.id }, include: { tiers: true } });

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(res));

    return res;

}

const badgeStats = async (userId: string, role: string) => {

    //lookup on cache
    const cacheKey = await redisKeys.badgesStatsUserKey({ userId });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

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

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

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
    getuserIdByUserName,
    updateProfile,
    getUserById,
    allUsers,
    status_update_user,
    deletemyAccount,
    userDetails,
    UpdateNotification,

    approveOrDeclineUser,

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
    badgeStats,

    userDetailsWithbalanceAdmin,
    sellerHubStatsForAdmin,
    buyerHubStatsForAdmin
}