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
            charity: { include: { picture: true } }
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

    const totalExtraDonation = await prisma.sellDonation.aggregate({
        _sum: {
            extra_money: true,
            amount: true,
        },
        where: {
            orderItem: {
                order: {
                    buyerId: user?.id,
                },
            },
            status: "PAID", // optional but recommended
        },
    });

    const totalExtraDonated = totalExtraDonation._sum.extra_money || 0;
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
            charity: { include: { picture: true } },
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

    const charities = await prisma.sellDonation.groupBy({
        by: ["charityId"],
        where: {
            orderItem: {
                product: {
                    userId: user?.id
                }
            },
            status: "PAID"
        },
    });

    const totalCharitiesToSupport = charities.length;


    const donationsByCharity = await prisma.$queryRaw<
        {
            charityId: string;
            charityName: string;
            charityImage: string | null;
            totalDonation: number;
        }[]
    >`
    SELECT
        sd."charityId" AS "charityId",
        u."userName" AS "charityName",
        pp."url" AS "charityImage",
        COALESCE(SUM(sd."total_amount"), 0) AS "totalDonation"
    FROM "sellItemMoneyDonations" sd

    INNER JOIN "users" u
        ON u."id" = sd."charityId"

    LEFT JOIN "profile_pictures" pp
        ON pp."userId" = u."id"

    INNER JOIN "OrderItem" oi
        ON oi."id" = sd."orderItemId"

    INNER JOIN "products" p
        ON p."id" = oi."productId"

    WHERE p."userId" = ${user.id}
      AND sd."status" = 'PAID'

    GROUP BY
        sd."charityId",
        u."userName",
        pp."url"

    ORDER BY "totalDonation" DESC
`;


    return {
        sellDonatedAmount: sellDonations._sum.amount || 0,
        avgSellDonationPercentage: avgSellDonationPercentage._avg.donation_percent || 0,
        totalCharitiesToSupport,
        donationsByCharity
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

    const extraDonationRaised = await prisma.sellDonation.findMany({
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
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const total = await prisma.sellDonation.count({
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

    return {
        meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
        data: extraDonationRaised,
    };
}

export const donationService = {
    memberDonationStats,
    selldonations,
    purchaseDonationsContribute,
    treeDonations,
    directMoneyDonations,
    sellerCharitySupportStats,
    charityStats,
    extraDonationsRaised
}