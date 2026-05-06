import { BillingDetails, Prisma, User } from "../../../generated/prisma/client";
import { Approval_Status, Role } from "../../../generated/prisma/enums";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import httpStatus from 'http-status'

// update user profile
const updateProfile = async (payload: User, userId: string, image?: { url: string, key: string }) => {

    const { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken } = payload

    const updateFields: Partial<User> = { phone, fname, lname, business_tags, website, facebook, instagram, twitter, tiktok, mission, description, country, state, city, address, zip_code, fcmToken };

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof User] === undefined || updateFields[key as keyof User] === null) {
            delete updateFields[key as keyof User];
        }
    });

    // check updated field found or not
    if (Object.keys(updateFields).length === 0) {
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

    const result = await prisma.user.update({ where: { id: userId }, data })

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
    const result = await prisma.user.findFirst({ where: { id }, include: { picture: true } });
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
            followers: { include: { follower: { include: { picture: true, auth: { select: { role: true } } } } } }, following: { include: { following: { include: { picture: true, auth: { select: { role: true } } } } } }
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

    return { user: res, review: ratingAvg, isfolowing: isfolowing ? true : false };
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
            sellerGroup: {
                sellerId: user.id,
                order: {
                    status: "COMPLETED", // ✅ important (avoid counting pending/cancelled)
                },
            },
        },
    });

    const totalFollowers = await prisma.follow.count({ where: { followingId: user?.id } });

    const totalSellDonation = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID", orderItem: {
                sellerGroup: {
                    sellerId: user?.id
                }
            }
        }, _sum: { amount: true }
    });

    const totalTreeDonation = await prisma.order.aggregate({ where: { status: "COMPLETED", userId : user?.id }, _sum: { treeCredit: true } });

    const totalSellDonationAmount = totalSellDonation?._sum?.amount || 0;
    const totalTreeDonationAmount = totalTreeDonation?._sum?.treeCredit || 0;

    return {
        totalProducts,
        totalSold: totalSold?._sum?.quantity || 0,
        totalFollowers,
        totalDonation: totalSellDonationAmount + totalTreeDonationAmount,
    };

}

const addOrUpdateBillingDetails = async (payload: BillingDetails, userId: string) => {
    const existDefaultBillingDetails = await prisma.billingDetails.findFirst({ where: { userId } });
    if (existDefaultBillingDetails) {
        await prisma.billingDetails.update({ where: { userId }, data: { userId: null } });
    }
    const res = await prisma.billingDetails.create({
        data: {
            ...payload,
            userId
        }
    })
    return res;
}

const billingDetailsByUser = async (userId: string) => {
    const res = await prisma.billingDetails.findFirst({ where: { userId } });

    return res;
}

export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    status_update_user,
    deletemyAccount,
    userDetails,
    UpdateNotification,

    allCharies,
    addOrUpdateBillingDetails,
    billingDetailsByUser,
    memberStats
}