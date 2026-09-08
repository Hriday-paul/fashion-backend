import { Approval_Status, AssistentSell, AssistentSellStatus, Prisma, Role } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import httpStatus from "http-status";


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

    const result = await prisma.assistentSell.create({
        data: {
            ...data,
            sellerId,
            status: "PENDING",
            donationAnonymous,
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

export const assistentSellService = {
    myRequests,
    addNewRequest,
    dltRequest
}