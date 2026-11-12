import { ThanksMessageType } from "../../../generated/prisma/enums";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma"
import httpstatus from "http-status"

const directMoneyDonations = async (userName: string) => {

    const donations = await prisma.directDonation.findMany({
        where: {
            payment: {
                status: "SUCCESSED"
            },
            donor: {
                userName
            }
        },
        orderBy: {
            donatedAt: "desc"
        },
        include: {
            charity: { include: { picture: true, charityThumbnail: true } },
            thanksMsg: true
        }
    });

    return donations;
}

const memberDonationStats = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

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

    const totalExtraDonation = await prisma.extraDonation.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            orderItem: {
                order: {
                    buyerId: user?.id,
                },
            },
            status: "PAID",
        },
    });

    const totalExtraDonated = totalExtraDonation._sum.amount || 0;
    const totalPurchaseDonationContribute = totalExtraDonation._sum.amount || 0;

    const directDonation = totalDirectDonationAmount;
    const clothDonation = 0;

    return {
        totalSellDonationAmount,
        totalTreeDonationAmount,
        totalExtraDonated,
        totalPurchaseDonationContribute,
        clothDonation,
        directDonation,
        total: totalSellDonationAmount + totalTreeDonationAmount + totalExtraDonated + clothDonation + directDonation
    }
}

const selldonations = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const sellDonations = await prisma.sellDonation.findMany({
        where: {
            status: "PAID",

            // 🔥 ignore records where are 0
            amount: {
                gt: 0
            },

            orderItem: {
                order: {
                    sellerId: user?.id
                }
            }
        },
        orderBy: {
            donatedAt: "desc"
        },
        include: {
            charity: { include: { picture: true, charityThumbnail: true } },
            thanksMessage: true,
            orderItem: {
                include: {
                    product: {
                        select: {
                            title: true,
                            images: {
                                take: 1,
                                orderBy: {
                                    order: "asc"
                                },
                                select: {
                                    url: true,
                                }
                            },
                            category: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },

                }
            }
        }
    });

    return sellDonations;
}

const contributionStats = async (userId: string) => {

    const totalSellDonation = await prisma.sellDonation.aggregate({
        where: {
            status: "PAID",
            orderItem: {
                order: {
                    buyerId: userId
                }
            }
        }, _sum: { amount: true }
    });

    const totalDirectDonation = await prisma.directDonation.aggregate({
        where: {
            payment: {
                status: "SUCCESSED"
            },
            donorId: userId
        }, _sum: { amount: true }
    });

    return {
        totalSellDonationAmount: totalSellDonation?._sum?.amount || 0,
        totalDirectDonationAmount: totalDirectDonation?._sum?.amount || 0,
    }

}

const purchaseDonationsContribute = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const purchaseDonations = await prisma.sellDonation.findMany({
        where: {
            status: "PAID",

            // 🔥 ignore records where BOTH are 0
            NOT: {
                AND: [
                    { amount: 0 },
                    { extra_money: 0 }
                ]
            },

            orderItem: {
                order: {
                    buyerId: user?.id
                }
            }
        },
        include: {
            charity: { include: { picture: true } },
            thanksMessage: true,
            orderItem: {
                include: {
                    product: {
                        select: {
                            title: true,
                            category: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },

                }
            }
        },
        orderBy: {
            donatedAt: "desc"
        }
    });

    return purchaseDonations;
}

const treeDonations = async (userName: string) => {

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const treeDonationOrders = await prisma.order.findMany({
        where: {
            treeCredit: {
                gt: 0
            },
            buyerId: user?.id,
            status: "COMPLETED"
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            treeCredit: true,
            createdAt: true,
        }
    });

    return treeDonationOrders;
}

const sellerCharitySupportStats = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const sellDonations = await prisma.sellDonation.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            status: "PAID",

            // 🔥 ignore records where are 0
            NOT: {
                AND: [
                    { amount: 0 }
                ]
            },

            orderItem: {
                order: {
                    sellerId: user?.id
                }
            }
        },
    });

    //avg sell donation percentage
    const avgSellDonationPercentage = await prisma.product.aggregate({
        _avg: {
            donation_percent: true,
        },
        where: {
            userId: user?.id,
        },
    });

    const charitiesSupport = await prisma.$queryRaw<
        {
            charityId: string;
            fname: string;
            lname: string | null;
            userName: string;
            charityName: string;
            charityBio: string | null;
            charityImage: string | null;
            totalDonation: number;
            productsSupported: number;
        }[]
    >`
    SELECT
        u."fname" AS "fname",
        u."lname" AS "lname",
        u."userName" AS "charityName",
        pp.url AS "charityImage",
        u."id" AS "charityId",
        u.bio AS "charityBio",
        u."userName" AS "userName",
        COALESCE(
            SUM(
                CASE
                    WHEN sd."status" = 'PAID'
                    THEN sd."amount"
                    ELSE 0
                END
            ),
            0
        ) AS "totalDonation",
        COUNT(DISTINCT pd."id")::int AS "productsSupported"
    from "productCharities" pc

        INNER JOIN "products" pd
            ON pd."id" = pc."productId"

        INNER JOIN "users" u
        ON u."id" = pc."charityId"

        LEFT JOIN "charity_thumbnails" pp
            ON pp."userId" = u."id"

        LEFT JOIN "OrderItem" oi
            ON oi."productId" = pd."id"
        
        LEFT JOIN "sellItemMoneyDonations" sd
            ON sd."orderItemId" = oi."id"

        WHERE pd."userId" = ${user.id}
            AND pd."isDeleted" = false

        GROUP BY
            u."id",
            pp."id"

        ORDER BY "totalDonation" DESC
    `

    return {
        sellDonatedAmount: sellDonations._sum.amount || 0,
        avgSellDonationPercentage: avgSellDonationPercentage._avg.donation_percent || 0,
        totalCharitiesToSupport: charitiesSupport.length,
        donationsByCharity: charitiesSupport
    }

}

const charityStats = async (userName: string) => {
    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const directDonationraised = await prisma.directDonation.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            charityId: user?.id,
            payment: {
                status: "SUCCESSED"
            }
        },
    });

    const extraDonationRaised = await prisma.sellDonation.aggregate({
        _sum: {
            extra_money: true,
        },
        where: {
            charityId: user?.id,
            orderItem: {
                order: {
                    payment: {
                        status: "SUCCESSED"
                    }
                }
            }
        },
    });

    const sellDonationRaised = await prisma.sellDonation.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            charityId: user?.id,
            status: "PAID"
        },
    });

    const totalRaised =
        (directDonationraised._sum?.amount || 0) +
        (extraDonationRaised._sum?.extra_money || 0) +
        (sellDonationRaised._sum?.amount || 0);

    return {
        directDonationraised: directDonationraised._sum?.amount || 0,
        extraDonationRaised: extraDonationRaised._sum?.extra_money || 0,
        sellDonationRaised: sellDonationRaised._sum?.amount || 0,
        totalRaised
    }
}

const extraDonationsRaised = async (options: TPaginationOptions, userName: string) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const user = await prisma.user.findFirst({ where: { userName } });

    if (!user) {
        throw new AppError(httpstatus.NOT_FOUND, "User Does not exist")
    }

    const extraDonationRaised = await prisma.extraDonation.findMany({
        where: {
            charityId: user?.id,
            status: "PAID"
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            thanksMessage: true,
            orderItem: {
                select: {
                    order: {
                        select: {
                            buyer: {
                                select: {
                                    id: true,
                                    userName: true,
                                    picture: true
                                }
                            }
                        }
                    }
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            images: {
                                orderBy: {
                                    order: "asc"
                                },
                                take: 1,
                                select: {
                                    url: true,
                                    id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const total = await prisma.extraDonation.count({
        where: {
            charityId: user?.id,
            status: "PAID"
        },
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
        data: extraDonationRaised,
    };
}

const sendThanksMessage = async (userId: string, payload: { message: string, referenceId: string, msgType: ThanksMessageType }) => {

    const { msgType, referenceId, message } = payload;

    const refId = msgType === ThanksMessageType.SELL ? { sellDonationId: referenceId } : msgType === ThanksMessageType.DIRECT ? { directDonationId: referenceId } : msgType === ThanksMessageType.CLOTH ? { clothDonationId: referenceId } : {};

    //check existing thanks message for the same referenceId and msgType
    const existingThanksMessage = await prisma.donationThanksMSg.findFirst({
        where: {
            ...refId,
            msgType: msgType,
        }
    });

    if (existingThanksMessage) {
        throw new AppError(httpstatus.BAD_REQUEST, "Msg already sent for this donation");
    }

    const thanksMessage = await prisma.donationThanksMSg.create({
        data: {
            donorId: userId,
            message: message,
            ...refId,
            msgType: msgType,
        }
    });

    return thanksMessage;
}

export const donationService = {
    memberDonationStats,
    contributionStats,
    selldonations,
    purchaseDonationsContribute,
    treeDonations,
    directMoneyDonations,
    sellerCharitySupportStats,
    charityStats,
    extraDonationsRaised,
    sendThanksMessage
}