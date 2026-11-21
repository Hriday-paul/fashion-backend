import httpStatus from "http-status";
import { ClothDonationStatus, DonationType, Role, WashedType } from "../../../generated/prisma/enums";
import { Prisma, User } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import { notificationQueue } from "../../queues/notificaion.queue";
import { jobs } from "../../queues/jobs.name";
import { cartService } from "../cart/cart.service";
import { createCheckoutSession } from "../payments/payments.utils";
import generateRandomString from "../../utils/generateRandomString";
import { orderService } from "../order/order.service";

export interface ICreateClothDonationPayload {
    charityId: string;
    donationType: DonationType;
    itemTypes?: string[];
    personTypes?: string[];
    brands?: string[];
    condition: string;
    washedType: WashedType;
    description?: string;
    itemsCount?: string;
    photos?: { url: string; key: string }[];
}

const donorCharitySelect = {
    photos: true,
    donor: {
        select: {
            id: true,
            userName: true,
            email: true,
            picture: true,
        }
    },
    charity: {
        select: {
            id: true,
            userName: true,
            email: true,
            picture: true,
        }
    },
    thanksMsg: true,
    shipment: true
};

// Helper to parse query values (single value, comma-separated string, or array) into valid enums
const parseEnumFilter = <T extends string>(value: unknown, allowedValues: T[]): T[] => {
    if (!value) return [];
    let items: string[] = [];

    if (Array.isArray(value)) {
        items = value.map(v => String(v).trim().toUpperCase());
    } else if (typeof value === "string") {
        items = value.split(",").map(v => v.trim().toUpperCase());
    }

    return items.filter((item): item is T => allowedValues.includes(item as T));
};

const createClothDonation = async (payload: ICreateClothDonationPayload, donorId: string) => {

    if (donorId === payload.charityId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot donate to yourself");
    }

    const charity = await prisma.user.findUnique({
        where: { id: payload.charityId },
        select: { id: true, fcmToken: true, userName: true }
    });

    if (!charity) {
        throw new AppError(httpStatus.NOT_FOUND, "Charity user not found");
    }

    const result = await prisma.clothDonation.create({
        data: {
            donorId,
            charityId: payload.charityId,
            donationType: payload.donationType,
            itemTypes: payload.itemTypes || [],
            personTypes: payload.personTypes || [],
            brands: payload.brands || [],
            condition: payload.condition,
            washedType: payload.washedType,
            description: payload.description,
            status: ClothDonationStatus.PENDING,
            itemsCount: payload.itemsCount,
            photos: payload.photos && payload.photos.length > 0 ? {
                create: payload.photos.map(p => ({
                    url: p.url,
                    key: p.key
                }))
            } : undefined
        },
        include: donorCharitySelect
    });

    // Notify charity of the new donation
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "New Cloth Donation Received",
            message: `You have received a new cloth donation request from **${result.donor?.userName}**.`,
            actorId: donorId,
            receiverId: charity.id,
            fcmToken: charity.fcmToken,
            entityImgs: payload.photos?.map(p => p.url) || [],
            entityId: result.id,
            entityType: "DONATION",
            type: "DONATION_RECEIVED",
            groupKeyId: null,
        }
    });


    return result;
};

const getDonationsAsDonor = async (
    donorId: string,
    query: Record<string, unknown>,
    options: TPaginationOptions
) => {
    const AndConditions: Prisma.ClothDonationWhereInput[] = [{ donorId }];

    // Filter by single or multiple donationType (SINGLE, MULTIPLE)
    const rawDonationType = query.donationType;

    if (rawDonationType) {
        const types = parseEnumFilter<DonationType>(rawDonationType, [
            DonationType.SINGLE,
            DonationType.MULTIPLE
        ]);
        if (types.length === 1) {
            AndConditions.push({ donationType: types[0] });
        } else if (types.length > 1) {
            AndConditions.push({ donationType: { in: types } });
        }
    }

    // Filter by status (single or multiple: PENDING, ACCEPTED, REJECTED, COMPLETED)
    if (query.status) {
        const statuses = parseEnumFilter<ClothDonationStatus>(query.status, [
            ClothDonationStatus.PENDING,
            ClothDonationStatus.ACCEPTED,
            ClothDonationStatus.REJECTED,
            ClothDonationStatus.COMPLETED
        ]);
        if (statuses.length === 1) {
            AndConditions.push({ status: statuses[0] });
        } else if (statuses.length > 1) {
            AndConditions.push({ status: { in: statuses } });
        }
    }

    // Optional text search
    if (query.searchTerm) {
        const searchTerm = String(query.searchTerm).trim();
        AndConditions.push({
            OR: [
                { condition: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                { charity: { userName: { contains: searchTerm, mode: "insensitive" } } },
                { charity: { email: { contains: searchTerm, mode: "insensitive" } } }
            ]
        });
    }

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    // ClothDonation does not have createdAt; default to sorting by id
    const validSortFields = ["id", "condition", "status", "donationType", "washedType"];
    const resolvedSortBy = validSortFields.includes(sortBy) ? sortBy : "id";

    const whereConditions: Prisma.ClothDonationWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const [result, total] = await Promise.all([
        prisma.clothDonation.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: {
                [resolvedSortBy]: sortOrder,
            },
            include: donorCharitySelect
        }),
        prisma.clothDonation.count({ where: whereConditions })
    ]);

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };
};

const getDonationsAsCharity = async (
    charityId: string,
    query: Record<string, unknown>,
    options: TPaginationOptions
) => {
    const AndConditions: Prisma.ClothDonationWhereInput[] = [{ charityId }];

    // Filter by single or multiple donationType (SINGLE, MULTIPLE)
    const rawDonationType = query.donationType || query.type;
    if (rawDonationType) {
        const types = parseEnumFilter<DonationType>(rawDonationType, [
            DonationType.SINGLE,
            DonationType.MULTIPLE
        ]);
        if (types.length === 1) {
            AndConditions.push({ donationType: types[0] });
        } else if (types.length > 1) {
            AndConditions.push({ donationType: { in: types } });
        }
    }

    // Filter by status (single or multiple: PENDING, ACCEPTED, REJECTED, COMPLETED)
    if (query.status) {
        const statuses = parseEnumFilter<ClothDonationStatus>(query.status, [
            ClothDonationStatus.PENDING,
            ClothDonationStatus.ACCEPTED,
            ClothDonationStatus.REJECTED,
            ClothDonationStatus.COMPLETED
        ]);
        if (statuses.length === 1) {
            AndConditions.push({ status: statuses[0] });
        } else if (statuses.length > 1) {
            AndConditions.push({ status: { in: statuses } });
        }
    }

    // Optional text search
    if (query.searchTerm) {
        const searchTerm = String(query.searchTerm).trim();
        AndConditions.push({
            OR: [
                { condition: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
                { donor: { userName: { contains: searchTerm, mode: "insensitive" } } },
                { donor: { email: { contains: searchTerm, mode: "insensitive" } } }
            ]
        });
    }

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const whereConditions: Prisma.ClothDonationWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const [result, total] = await Promise.all([
        prisma.clothDonation.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: donorCharitySelect
        }),
        prisma.clothDonation.count({ where: whereConditions })
    ]);

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: result,
    };
};

const updateStatusAsCharity = async (
    donationId: string,
    charityId: string,
    userRole: Role | string,
    status: string
) => {

    if (status !== ClothDonationStatus.ACCEPTED && status !== ClothDonationStatus.REJECTED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
    }

    const donation = await prisma.clothDonation.findUnique({
        where: { id: donationId },
        include: {
            donor: {
                select: {
                    id: true,
                    userName: true,
                    fcmToken: true
                }
            },
            charity: {
                select: {
                    id: true,
                    userName: true
                }
            },
            photos: true
        }
    });

    if (!donation) {
        throw new AppError(httpStatus.NOT_FOUND, "Cloth donation not found");
    }

    // Only the assigned charity or admin can approve / decline
    if (userRole !== Role.ADMIN && donation.charityId !== charityId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this donation");
    }

    const updated = await prisma.clothDonation.update({
        where: { id: donationId },
        data: { status },
        include: donorCharitySelect
    });

    // Notify donor of status change
    const isApproved = status === ClothDonationStatus.ACCEPTED;
    const title = isApproved ? "Cloth Donation Approved" : "Cloth Donation Declined";
    const message = isApproved
        ? `**${donation.charity?.userName}** has approved your cloth donation.`
        : `**${donation.charity?.userName}** has declined your cloth donation.`;

    await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title,
            message,
            actorId: charityId,
            receiverId: donation.donorId,
            fcmToken: donation.donor?.fcmToken,
            entityImgs: donation.photos?.map(p => p.url) || [],
            entityId: donation.id,
            entityType: "DONATION",
            type: "DONATION_RECEIVED",
            groupKeyId: null,
        }
    });


    return updated;
};

const getRates = async (donationReqId: string, cUserId: string) => {

    const donation = await prisma.clothDonation.findUnique({
        where: { id: donationReqId, donorId: cUserId },
        include: {
            donor: {
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    fcmToken: true
                }
            },
            charity: {
                select: {
                    id: true,
                    userName: true
                }
            }
        }
    });

    if (!donation) {
        throw new AppError(httpStatus.NOT_FOUND, "Request not found");
    }

    //check if donation is approved
    if (donation.status !== ClothDonationStatus.ACCEPTED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Request is not approved yet");
    }

    const donor_address = await prisma.billingDetails.findFirst({
        where: {
            sellerId: donation?.donorId
        }
    })

    const charity_address = await prisma.billingDetails.findFirst({
        where: {
            userId: donation?.charityId
        }
    })

    if (!donor_address || !charity_address) {
        throw new AppError(httpStatus.BAD_REQUEST, "Address does not exist");
    }

    //get shipment cost
    const rates = await cartService.getRates({
        origin: donor_address,
        destination: charity_address,
        items: [
            {
                finalPrice: 0,
                hight_cm: donation?.hight_cm,
                length_cm: donation?.length_cm,
                weight_kg: donation?.weight_kg,
                width_cm: donation?.width_cm,
            }
        ]
    })

    return rates;

}

const payShipingCost = async (payload: { donationReqId: string, shipmentServiceId: string }, cUserId: string) => {

    const { donationReqId, shipmentServiceId } = payload;

    const donation = await prisma.clothDonation.findUnique({
        where: { id: donationReqId, donorId: cUserId },
        include: {
            donor: {
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    fcmToken: true
                }
            },
            charity: {
                select: {
                    id: true,
                    userName: true
                }
            },
        }
    });

    if (!donation) {
        throw new AppError(httpStatus.NOT_FOUND, "Cloth donation not found");
    }

    //check if donation is approved
    if (donation.status !== ClothDonationStatus.ACCEPTED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Request is not approved yet");
    }

    //check have already a shipment & get paid
    const existingShipment = await prisma.shipment.findFirst({
        where: {
            clothDonationId: donation?.id,
            userId: cUserId
        }
    });

    if (existingShipment && existingShipment?.isPaid) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipping cost already paid");
    }

    const donor_address = await prisma.billingDetails.findFirst({
        where: {
            sellerId: donation?.donorId
        }
    })

    const charity_address = await prisma.billingDetails.findFirst({
        where: {
            userId: donation?.charityId
        }
    })

    if (!donor_address || !charity_address) {
        throw new AppError(httpStatus.BAD_REQUEST, "Address does not exist");
    }

    //get shipment cost
    const rates = await cartService.getRates({
        origin: donor_address,
        destination: charity_address,
        items: [
            {
                finalPrice: 0,
                hight_cm: donation?.hight_cm,
                length_cm: donation?.length_cm,
                weight_kg: donation?.weight_kg,
                width_cm: donation?.width_cm,
            }
        ]
    })

    const shippingRate = rates?.rates?.find(rate => rate?.courier_service?.id === shipmentServiceId)?.total_charge;

    if (!shippingRate) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipping rate not available for the selected courier service");
    }

    const shipmentData = await orderService.placeOrderShipment({
        courierServiceId: payload?.shipmentServiceId,
        origin: donor_address,
        destination: charity_address,
        items: [
            {
                weight_kg: donation?.weight_kg,
                hight_cm: donation?.hight_cm,
                width_cm: donation?.width_cm,
                length_cm: donation?.length_cm,
                finalPrice: 0,
                title: "Fashi-on Cloth Donation"
            }
        ]
    });

    const parcelId = shipmentData?.shipment?.parcels[0]?.id;

    const shipmentItems = shipmentData?.shipment?.parcels[0]?.items || [];

    const checkout_item = {
        amount: shippingRate,
        images: [],
        name: `Cloth Donation Shipping Cost`,
        quantity: 1,
    };

    const tranId = generateRandomString(10);

    const transactionResult = await prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.upsert({
            where: {
                clothDonationId: donation?.id
            },
            create: {
                courier_service_id: shipmentServiceId,
                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                deliveryCharge: shippingRate,
                originId: donor_address?.id,
                destinationId: charity_address?.id,
                userId: cUserId,
            },
            update: {
                courier_service_id: shipmentServiceId,
                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                deliveryCharge: shippingRate,
                originId: donor_address?.id,
                destinationId: charity_address?.id,
                userId: cUserId,
            }
        });

        //create new payment for this cart group
        const createdPayment = await tx.payment.upsert({
            where: {
                shipmentId: shipment?.id
            },
            create: {
                userId: donation?.donorId,
                total_amount: shippingRate,
                paid_amount: 0,
                seller_required_amount: 0,
                seller_received_amount: 0,
                status: "PENDING",
                stripe_status: "PENDING",
                transactionId: tranId,
                paymentType: "SHIPMENT",
                shipmentId: shipment?.id,
            },
            update: {
                total_amount: shippingRate,
                shipmentId: shipment?.id,
            },
            include: {
                user: true
            }
        })

        return { shipment, createdPayment };
    })

    const checkoutSession = await createCheckoutSession({
        products: [checkout_item],
        user: donation?.donor as User,
        paymentId: transactionResult?.createdPayment?.id
    });

    return checkoutSession?.url;

}

const getShippinglabel = async (donationReqId: string, cUserId: string) => {
    const donation = await prisma.clothDonation.findUnique({
        where: { id: donationReqId, donorId: cUserId },
        include: {
            shipment: true
        }
    });

    if (!donation) {
        throw new AppError(httpStatus.NOT_FOUND, "Donation request does not exist");
    }

    if (!donation?.shipment) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipment does not exist for this donation request");
    }

    if (!donation?.shipment?.isPaid) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipment cost is not paid yet");
    }

    if (donation?.shipment?.lebelUrl) {
        return donation?.shipment?.lebelUrl;
    }

    else if (donation?.shipment?.isLebelGenerated) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label already generated but not available, please contact support")
    }

    const labelUrl = await orderService.createLebelForOrder({ shipment_id: donation?.shipment?.shippingId, dbShipmentId: donation?.shipment?.id });

    if (!labelUrl) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label generation failed, please contact support")
    }

    return labelUrl;
}

export const clothDonationService = {
    createClothDonation,
    getDonationsAsDonor,
    getDonationsAsCharity,
    updateStatusAsCharity,
    payShipingCost,
    getRates,
    getShippinglabel
};
