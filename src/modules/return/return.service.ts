import { Prisma, ReturnReason, ReturnStatus } from "../../../generated/prisma/client";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";

const returnsAsABuyer = async (buyerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.ReturnWhereInput[] = [{ buyerId }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

    // if (searchTerm) {
    //     AndConditions.push({
    //         OR: [
    //             {
    //                 id: {
    //                     contains: searchTerm as string,
    //                     mode: "insensitive",
    //                 },
    //             },
    //             {
    //                 buyer: {
    //                     OR: [
    //                         {
    //                             fname: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             lname: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             email: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             phone: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         }
    //                     ],
    //                 }
    //             },
    //             {
    //                 billingDetails: {
    //                     OR: [
    //                         {
    //                             full_name: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             contact: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             email: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             address1: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             address2: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         }
    //                     ]
    //                 }
    //             },
    //             {
    //                 items: {
    //                     some: {
    //                         product: {
    //                             OR: [
    //                                 {
    //                                     title: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     },
    //                                 },
    //                                 {
    //                                     description: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     }
    //                                 },
    //                                 {
    //                                     id: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     },
    //                                 },

    //                             ]
    //                         },
    //                     }
    //                 }
    //             },
    //         ],
    //     });
    // }

    if (status) {
        AndConditions.push({
            status: status as ReturnStatus
        })
    }

    const whereConditions: Prisma.ReturnWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.return.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },

    })

    const total = await prisma.return.count({
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

const returnsAsASeller = async (sellerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.ReturnWhereInput[] = [{ sellerId }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

    // if (searchTerm) {
    //     AndConditions.push({
    //         OR: [
    //             {
    //                 id: {
    //                     contains: searchTerm as string,
    //                     mode: "insensitive",
    //                 },
    //             },
    //             {
    //                 buyer: {
    //                     OR: [
    //                         {
    //                             fname: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             lname: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             email: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             phone: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         }
    //                     ],
    //                 }
    //             },
    //             {
    //                 billingDetails: {
    //                     OR: [
    //                         {
    //                             full_name: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             },
    //                         },
    //                         {
    //                             contact: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             email: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             address1: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         },
    //                         {
    //                             address2: {
    //                                 contains: searchTerm as string,
    //                                 mode: "insensitive",
    //                             }
    //                         }
    //                     ]
    //                 }
    //             },
    //             {
    //                 items: {
    //                     some: {
    //                         product: {
    //                             OR: [
    //                                 {
    //                                     title: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     },
    //                                 },
    //                                 {
    //                                     description: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     }
    //                                 },
    //                                 {
    //                                     id: {
    //                                         contains: searchTerm as string,
    //                                         mode: "insensitive",
    //                                     },
    //                                 },

    //                             ]
    //                         },
    //                     }
    //                 }
    //             },
    //         ],
    //     });
    // }

    if (status) {
        AndConditions.push({
            status: status as ReturnStatus
        })
    }

    const whereConditions: Prisma.ReturnWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.return.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },

    })

    const total = await prisma.return.count({
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

const returns = async (query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.ReturnWhereInput[] = [];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status, reason } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    id: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                fname: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                lname: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                phone: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            }
                        ],
                    }
                },
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as ReturnStatus
        })
    }

    if(reason){
        AndConditions.push({
            reason: reason as ReturnReason
        })
    }

    const whereConditions: Prisma.ReturnWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.return.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            items: {
                select: {
                    orderItem: {
                        select: {
                            product: {
                                select: {
                                    title: true,
                                    images: {
                                        select: {
                                            url: true
                                        },
                                        take: 1,
                                        orderBy: {
                                            order: "asc"
                                        }
                                    }
                                }
                            },
                            unitPrice: true,
                            unitAllocatedPrice: true,
                        },
                    }
                }
            },
            order : {
                select : {
                    orderNumber: true,
                    id: true,
                }
            },
            evidence: true,
            buyer: {
                select: {
                    userName: true,
                    id: true,
                    picture: true
                }
            },
            seller: {
                select: {
                    userName: true,
                    id: true,
                    picture: true
                }
            },
            shipment : {
                include : {
                    destination : true,
                    origin : true
                }
            }
        }
    })

    const total = await prisma.return.count({
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

const returnStats = async () => {
    const totalReturns = await prisma.return.count();

    const pendingReturns = await prisma.return.count({
        where: {
            status: ReturnStatus.REQUESTED
        }
    });

    const approvedReturns = await prisma.return.count({
        where: {
            status: ReturnStatus.APPROVED
        }
    });

    const rejectedReturns = await prisma.return.count({
        where: {
            status: ReturnStatus.DECLINED
        }
    });

    const completedReturns = await prisma.return.count({
        where: {
            status: ReturnStatus.COMPLETED
        }
    });

    const shippingReturns = await prisma.return.count({
        where: {
            status: ReturnStatus.SHIPPING
        }
    });

    return {
        totalReturns,
        pendingReturns,
        approvedReturns,
        rejectedReturns,
        completedReturns,
        shippingReturns
    };
}

export const returnService = {
    returnsAsABuyer,
    returnsAsASeller,
    returns,
    returnStats
}