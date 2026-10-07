import prisma from "../../shared/prisma";
import { Role } from "../../../generated/prisma/enums";
import moment from "moment";


const userChart = async (query: Record<string, unknown>) => {
    let year = new Date().getFullYear();

    if (query.JoinYear) {
        year = Number(query.JoinYear);
    }

    // Step 1: Fetch all users of that year
    const users = await prisma.user.findMany({
        where: {
            isDeleted: false,
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`),
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
            },
            auth: {
                // Exclude admin users
                role: {
                    not: "ADMIN",
                },
            },
        },
        select: { createdAt: true },
    });

    // Step 2: Create 12 months array
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const monthsUserCount = monthNames.map((month) => ({
        month,
        userCount: 0,
    }));

    // Step 3: Loop and count users per month
    users.forEach((u) => {
        const monthIndex = u.createdAt.getMonth();
        monthsUserCount[monthIndex].userCount += 1;
    });

    return monthsUserCount;
};

const ordersOverviewChart = async (query: Record<string, unknown>) => {
    let year = new Date().getFullYear();
    if (query.JoinYear) {
        year = Number(query.JoinYear);
    }

    const result = await prisma.order.groupBy({
        by: ["createdAt"],
        where: {
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
            },
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        },
        _sum: {
            totalPrice: true,
        },
    });

    // Step 2: Aggregate data by months
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Initialize monthly orders array
    const monthsPaymentCount = Array.from({ length: 12 }, (_, i) => ({
        month: monthNames[i],
        orders: 0,
    }));

    // Populate monthly orders array
    result.forEach((entry) => {
        const monthIndex = new Date(entry.createdAt).getMonth(); // Extract month index
        const revenue = entry._sum.totalPrice || 0; // Get the orders for the month
        monthsPaymentCount[monthIndex].orders += revenue;
    });

    // Step 4: Return the populated monthsUserCount array
    return monthsPaymentCount;

}

const orderStatusChart = async (query: Record<string, unknown>) => {
    let year = new Date().getFullYear();
    if (query.JoinYear) {
        year = Number(query.JoinYear);
    }

    const pendingOrder = await prisma.order.count({
        where: {
            status: "PENDING",
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
            },
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const shipingOrder = await prisma.order.count({
        where: {
            status: "SHIPPING",
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
            },
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const deliveredOrder = await prisma.order.count({
        where: {
            status: "COMPLETED",
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
            },
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const canceledOrder = await prisma.order.count({
        where: {
            status: "CANCELLED",
            createdAt: {
                gte: new Date(`${year}-01-01T00:00:00.000Z`), // Start of the year
                lt: new Date(`${year + 1}-01-01T00:00:00.000Z`), // Start of the next year
            },
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    });

    const totalOrders = pendingOrder + shipingOrder + deliveredOrder + canceledOrder;

    const percentageData = [
        { status: "PENDING", count: totalOrders > 0 ? (pendingOrder / totalOrders) * 100 : 0 },
        { status: "SHIPPING", count: totalOrders > 0 ? (shipingOrder / totalOrders) * 100 : 0 },
        { status: "COMPLETED", count: totalOrders > 0 ? (deliveredOrder / totalOrders) * 100 : 0 },
        { status: "CANCELLED", count: totalOrders > 0 ? (canceledOrder / totalOrders) * 100 : 0 },
    ];

    return percentageData;
};

const countData = async () => {

    const totalUsers = await prisma.user.count({ where: { auth: { role: { not: Role.ADMIN } } } });

    const totalTreeCreditErning = await prisma.order.aggregate({
        _sum: { treeCredit: true },
        where: {
            payment: {
                status: {
                    in: ["SUCCESSED", "REFUNDED"]
                }
            }
        }
    })

    const totalSellDonationRaised = await prisma.sellDonation.aggregate({
        _sum: { amount: true },
        where: {
            orderItem: {
                order: {
                    status: "COMPLETED"
                }
            }
        }
    });

    const extraDonationRaised = await prisma.sellDonation.aggregate({
        _sum: { extra_money: true },
        where: {
            orderItem: {
                order: {
                    payment: {
                        status: {
                            in: ["SUCCESSED", "REFUNDED"]
                        }
                    }
                }
            }
        }
    });

    const directDonationRaised = await prisma.directDonation.aggregate({
        _sum: { amount: true },
        where: {
            payment: {
                status: {
                    in: ["SUCCESSED"]
                }
            }
        }
    });

    const totalDonationRaised = (totalSellDonationRaised._sum?.amount || 0) + (extraDonationRaised._sum?.extra_money || 0) + (directDonationRaised._sum?.amount || 0);

    const avaialableListingForSale = await prisma.product.count({ where: { isDeleted: false, stock: { gt: 0 } } });

    return {
        totalUsers: totalUsers.toFixed(),
        treeEarning: (totalTreeCreditErning._sum?.treeCredit || 0).toFixed(2),
        totalDonationRaised: totalDonationRaised.toFixed(2),
        avaialableListingForSale: avaialableListingForSale.toFixed()
    }
}

const productCountByParentCategory = async () => {
    const parentCats = await prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true },
    });

    const counts = await Promise.all(
        parentCats.map(async (cat) => ({
            categoryId: cat.id,
            name: cat.name,
            count: await prisma.product.count({
                where: { catagory_hierarchy: { has: cat.id } },
            }),
        }))
    );

    return counts;
};

const bestSellsUserByMonth = async (query: Record<string, unknown>) => {
    let monthStart = moment().startOf('month').toDate();
    let monthEnd = moment().endOf('month').toDate();

    if (query.month) {
        const month = Number(query.month);
        const year = Number(query.year) || new Date().getFullYear();
        monthStart = moment(`${year}-${month}-01`).startOf('month').toDate();
        monthEnd = moment(`${year}-${month}-01`).endOf('month').toDate();
    }

   const ranked = await prisma.order.groupBy({
        by: ["sellerId"],
        where: {
            status: "COMPLETED", // only count finished sales
            seller: { isDeleted: false },
            completedAt: {
                gte: monthStart,
                lte: monthEnd,
            },
        },
        _count: { id: true },
        _sum: { sellerTotal: true },
        orderBy: { _count: { sellerTotal: "desc" } },
        take: 10,
    });

    const users = await prisma.user.findMany({
        where: { id: { in: ranked.map(r => r.sellerId) } },
        select: {
            id: true,
            userName: true,
            picture: true,
        },
    });

    return users;

}

export const dashboardService = {
    userChart,
    countData,
    productCountByParentCategory,
    ordersOverviewChart,
    orderStatusChart,
    bestSellsUserByMonth
}