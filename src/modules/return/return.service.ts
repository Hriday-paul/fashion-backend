import { Prisma, ReturnStatus } from "../../../generated/prisma/client";
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

export const returnService = {
    returnsAsABuyer,
    returnsAsASeller
}