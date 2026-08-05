import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpstatus from "http-status"

const directMoneyDonations = async (userName: string) => {

    const donations = await prisma.directDonation.findMany({
        where: {
            status: "SUCCESS",
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
            status: "SUCCESS",
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

export const donationService = {
    memberDonationStats,
    selldonations,
    purchaseDonationsContribute,
    treeDonations,
    directMoneyDonations
}