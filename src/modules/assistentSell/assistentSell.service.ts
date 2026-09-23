import { Approval_Status, AssistentSell, AssistentSellStatus, PriceType, Prisma, Product, Role } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { jobs } from "../../queues/jobs.name";
import { notificationQueue } from "../../queues/notificaion.queue";
import prisma from "../../shared/prisma";
import httpStatus from "http-status";
import { categoryService } from "../category/category.service";
import { BadgeGenerateQueue } from "../../queues/badge.queue";
import { productService } from "../product/product.service";

const allRequests = async (query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.AssistentSellWhereInput[] = [];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status, priceType } = query;

    if (status) {
        AndConditions.push({
            status: status as AssistentSellStatus
        })
    }

    if (priceType) {
        AndConditions.push({
            priceType: priceType as PriceType
        })
    }

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    itemsTitle: {
                        contains: searchTerm as string,
                        mode: 'insensitive'
                    }
                },
                {
                    contactNumber: {
                        contains: searchTerm as string,
                        mode: 'insensitive'
                    }
                },
                {
                    seller: {
                        userName: {
                            contains: searchTerm as string,
                            mode: 'insensitive'
                        }
                    }
                }
            ]
        })
    }

    const whereConditions: Prisma.AssistentSellWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.assistentSell.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            pictures: {
                orderBy: {
                    order: 'asc'
                },
                select: {
                    key: true,
                    url: true,
                    id: true
                }
            },
            charities: {
                select: {
                    charityId: true,
                    charity: {
                        select: {
                            fname: true,
                            lname: true,
                            userName: true,
                            picture: {
                                select: {
                                    key: true,
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            seller: {
                select: {
                    userName: true,
                    picture: {
                        select: {
                            url: true,
                        }
                    }
                }
            },
            order: {
                select: {
                    status: true,
                    originDetails: true,
                    billingDetails: true,
                }
            }
        },
    })

    const total = await prisma.assistentSell.count({
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


const myRequests = async (sellerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.AssistentSellWhereInput[] = [{ sellerId }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

    if (status) {
        AndConditions.push({
            status: status as AssistentSellStatus
        })
    }

    const whereConditions: Prisma.AssistentSellWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.assistentSell.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            pictures: {
                take: 1,
                orderBy: {
                    order: 'asc'
                },
                select: {
                    key: true,
                    url: true,
                    id: true
                }
            },
            charities: {
                select: {
                    charityId: true,
                    charity: {
                        select: {
                            fname: true,
                            lname: true,
                            userName: true,
                            picture: {
                                select: {
                                    key: true,
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            listings: {
                select: {
                    id: true,
                    title: true,
                    finalPrice: true,
                    price: true,
                    discountPct: true,
                    images: {
                        take: 1,
                        orderBy: {
                            order: 'asc'
                        },
                        select: {
                            key: true,
                            url: true
                        }
                    },
                    size: {
                        select: {
                            title: true,
                            id: true
                        }
                    }
                }
            },
            order: {
                select: {
                    status: true,
                }
            }
        },
    })

    const total = await prisma.assistentSell.count({
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

const requestDetails = async (requestId: string) => {
    const result = await prisma.assistentSell.findFirst({
        where: {
            id: requestId
        },
        include: {
            seller: {
                select: {
                    userName: true,
                }
            },
            charities: {
                select: {
                    charityId: true,
                    charity: {
                        select: {
                            userName: true,
                            id: true,
                            picture: {
                                select: {
                                    url: true,
                                    key: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Request not found");
    }

    return result;
}


type OtherPayload = {
    pictures: { key: string, url: string }[],
    charities: string[],
    donationAnonymous: boolean,
}


const addNewRequest = async (payload: AssistentSell & OtherPayload, sellerId: string, role: string) => {

    const { deliveryCharge, id, status, createdAt, updatedAt, charities, pictures, donationAnonymous, ...data } = payload

    //charity required for all roles, without eco friendly store and charity shop and charitable organization

    const non_req_charity_roles: string[] = [Role.ECO_FRIENDLY_STORE, Role.CHARITY_SHOP];
    const isAllowCharity = !non_req_charity_roles.includes(role);

    if (isAllowCharity && (!charities || charities?.length === 0 || data?.donationPct < 5)) {

        throw new AppError(httpStatus.BAD_REQUEST, "Minimum donation percentage and charity is required");
    }

    if (charities?.length > 0) {
        const CHARITY_ROLES = [
            Role.CHARITY_SHOP,
            Role.CHARITABLE_ORGANIZATION,
        ];
        const charityIds = charities;
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

    const finalcharities = isAllowCharity ? charities?.map(i => ({ charityId: i, isAnonymous: donationAnonymous ? true : false })) : [];

    //validatity seller address
    const sellerAddress = await prisma.billingDetails.findFirst({
        where: {
            sellerId: sellerId
        }
    });

    if (!sellerAddress) {
        throw new AppError(httpStatus.BAD_REQUEST, "Please add your shipping address before creating a request");
    }

    const result = await prisma.assistentSell.create({
        data: {
            ...data,
            sellerId,
            status: "PENDING",
            donationAnonymous,
            sellerAddressId: sellerAddress?.id,
            pictures: { create: pictures },
            charities: { create: finalcharities },
        }
    });

    return result;
}

const dltRequest = async (requestId: string, sellerId: string) => {

    const request = await prisma.assistentSell.findFirst({
        where: {
            id: requestId
        }
    });


    if (!request) {
        throw new AppError(httpStatus.NOT_FOUND, "Request not found");
    }

    if (request?.sellerId !== sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized to delete this request");
    }

    if (
        request.status !== AssistentSellStatus.PENDING &&
        request.status !== AssistentSellStatus.REJECTED
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only pending or rejected requests can be deleted"
        );
    }

    await prisma.assistentSell.delete({
        where: {
            id: requestId,
        }
    });

    return;
}

const acceptDeclineRequest = async (payload: { requestId: string; status: AssistentSellStatus }) => {

    const { requestId, status } = payload;

    //check if request exists
    const request = await prisma.assistentSell.findFirst({
        where: {
            id: requestId
        },
        include: {
            seller: {
                select: {
                    id: true,
                    fcmToken: true
                }
            },
            pictures: true,
        }
    });

    if (!request) {
        throw new AppError(httpStatus.NOT_FOUND, "Request does not exist");
    }

    //check if already responded
    if (request.status !== AssistentSellStatus.PENDING) {
        throw new AppError(httpStatus.BAD_REQUEST, "Request has already been responded to");
    }

    if (!request?.seller) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller does not exist");
    }

    // Update the request status to accepted
    await prisma.assistentSell.update({
        where: {
            id: requestId
        },
        data: {
            status
        }
    });

    const noti_msg =
        status === AssistentSellStatus.APPROVED
            ? "Your assisted sell request has been **Approved**. Please proceed with shipping."
            : "Your assisted sell request was **Rejected**. Please fulfill the requirements and submit a new request.";

    // Notify the seller
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Assisted sell Request " + (status === AssistentSellStatus.APPROVED ? "Approved" : "Rejected"),
            message: noti_msg,
            actorId: request?.seller?.id,
            receiverId: request?.seller?.id,
            fcmToken: request?.seller?.fcmToken,
            entityImgs: request?.pictures?.map(p => p.url) || [],
            entityId: requestId,
            entityType: "ASSISTED_SELL",
            type: "ASSISTED_SELL_STATUS_UPDATED",
            groupKeyId: null,
        }
    });

}

const markAsListed = async (requestId: string) => {
    //check if request exists
    const request = await prisma.assistentSell.findFirst({
        where: {
            id: requestId
        },
        include: {
            seller: {
                select: {
                    id: true,
                    fcmToken: true
                }
            },
            pictures: true,
        }
    });

    if (!request) {
        throw new AppError(httpStatus.NOT_FOUND, "Request does not exist");
    }

    if (request.status !== AssistentSellStatus.APPROVED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Only approved requests can be marked as listed");
    }

    if (!request?.seller) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller does not exist");
    }

    await prisma.assistentSell.update({
        where: {
            id: requestId
        },
        data: {
            status: AssistentSellStatus.LISTED
        }
    });


    // Notify the seller
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Assisted sell item Listed",
            message: "Your assisted sell items has been **Listed**. You can now view your listings.",
            actorId: request?.seller?.id,
            receiverId: request?.seller?.id,
            fcmToken: request?.seller?.fcmToken,
            entityImgs: request?.pictures?.map(p => p.url) || [],
            entityId: requestId,
            entityType: "ASSISTED_SELL",
            type: "ASSISTED_SELL_STATUS_UPDATED",
            groupKeyId: null,
        }
    });
}

const requestListingStats = async (requestId: string) => {

    const totalListings = await prisma.product.count({
        where: {
            assistentSellId: requestId,
            isDeleted: false
        }
    });

    const totalSoldListings = await prisma.product.count({
        where: {
            assistentSellId: requestId,
            isDeleted: false,
            stock: 0
        }
    });

    const totalUnsoldListings = await prisma.product.count({
        where: {
            assistentSellId: requestId,
            isDeleted: false,
            stock: {
                gt: 0
            }
        }
    });

    const totalSells = await prisma.order.aggregate({
        where: {
            items: {
                some: {
                    product: {
                        assistentSellId: requestId
                    }
                }
            },
            payment: {
                status: "SUCCESSED"
            },
            // status: "COMPLETED"
        },
        _sum: {
            itemsTotal: true
        }
    });

    const completedSells = await prisma.order.aggregate({
        where: {
            items: {
                some: {
                    product: {
                        assistentSellId: requestId
                    }
                }
            },
            payment: {
                status: "SUCCESSED"
            },
            status: "COMPLETED"
        },
        _sum: {
            itemsTotal: true
        }
    });

    const pendingSells = await prisma.order.aggregate({
        where: {
            items: {
                some: {
                    product: {
                        assistentSellId: requestId
                    }
                }
            },
            payment: {
                status: "SUCCESSED"
            },
            status: {
                notIn: ["CANCELLED", "COMPLETED"]
            }
        },
        _sum: {
            itemsTotal: true
        }
    });

    const sellerEarnings = await prisma.order.aggregate({
        where: {
            items: {
                some: {
                    product: {
                        assistentSellId: requestId
                    }
                }
            },
            payment: {
                status: "SUCCESSED"
            },
            status: "COMPLETED"
        },
        _sum: {
            sellerItemsTotal: true
        }
    });

    return {
        totalListings: totalListings,
        totalSoldListings: totalSoldListings,
        totalUnsoldListings: totalUnsoldListings,
        totalSells: totalSells._sum.itemsTotal || 0,
        sellerEarnings: sellerEarnings._sum.sellerItemsTotal || 0,
        platformEarnings: (completedSells._sum.itemsTotal || 0) - (sellerEarnings._sum.sellerItemsTotal || 0),
        pendingSells: pendingSells._sum.itemsTotal || 0,
        completedSells: completedSells._sum.itemsTotal || 0
    };

}

const listings = async (requestId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ assistentSellId: requestId, isDeleted: false }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

    if (status) {
        if (status === "SOLD") {
            AndConditions.push({
                stock: 0
            })
        }
        if (status === "UNSOLD") {
            AndConditions.push({
                stock: {
                    gt: 0
                }
            })
        }
    }

    if (searchTerm) {
        AndConditions.push({
            title: {
                contains: searchTerm as string,
                mode: 'insensitive'
            }
        })
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
            images: {
                take: 1,
                orderBy: {
                    order: 'asc'
                },
                select: {
                    key: true,
                    url: true,
                    id: true
                }
            },
            size: {
                select: {
                    title: true,
                    id: true
                }
            }
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ limit, page, total }),
        data: result,
    };
}

type ProductOtherPayload = {
    images: { key: string, url: string }[],
    charities: string[],
    donationPrivacy: boolean,
    assistentSellId: string
}

const addNewListing = async (payload: Product & ProductOtherPayload) => {

    const request = await prisma.assistentSell.findFirst({
        where: {
            id: payload.assistentSellId
        },
        include: {
            seller: {
                select: {
                    id: true,
                    auth: {
                        select: {
                            role: true
                        }
                    }
                }
            }
        }
    });

    if (!request) {
        throw new AppError(httpStatus.NOT_FOUND, "Request does not exist");
    }

    if (request.status == AssistentSellStatus.PENDING || request.status == AssistentSellStatus.REJECTED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Only approved requests can be listed");
    }

    if (!request?.seller?.auth?.role) {
        throw new AppError(httpStatus.BAD_REQUEST, "Seller does not exist");
    }

    //create a new product
    await productService.addNewProduct(payload, request?.seller?.auth?.role, request?.seller?.id);

}

export const assistentSellService = {
    allRequests,
    myRequests,
    requestDetails,
    addNewRequest,
    dltRequest,
    acceptDeclineRequest,
    markAsListed,
    listings,
    addNewListing,
    requestListingStats,
}