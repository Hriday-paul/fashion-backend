import { ShipmentStatus } from "../../../generated/prisma/enums";

import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import config from "../../config";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import prisma from "../../shared/prisma";

const mapEasyshipStatus = (
    status?: string
): ShipmentStatus | undefined => {
    const normalized = status?.trim().toLowerCase();

    const statusMap: Record<string, ShipmentStatus> = {
        "pending": ShipmentStatus.PENDING,

        "arrived at consolidation center": ShipmentStatus.PICKED_UP,

        "shipped": ShipmentStatus.IN_TRANSIT,
        "in transit to customer": ShipmentStatus.IN_TRANSIT,
        "shipped (no tracking provided)": ShipmentStatus.IN_TRANSIT,

        "out for delivery": ShipmentStatus.OUT_FOR_DELIVERY,

        "delivered": ShipmentStatus.DELIVERED,

        "failed delivery attempt": ShipmentStatus.CANCELLED,

        "to be returned": ShipmentStatus.CANCELLED,
        "lost by courier": ShipmentStatus.CANCELLED,
        "liquidated": ShipmentStatus.CANCELLED,

        // "exception": "EXCEPTION",
        // "delivery expected (end of updates)": "DELIVERY_EXPECTED",
        // "processing at consolidation center": "IN_TRANSIT",
        // "in transit to consolidation center": "IN_TRANSIT",
        // "no recent tracking updates": "UNKNOWN",
        // "uncancelled": "PENDING",
    };

    return statusMap[normalized ?? ""] ?? undefined;
};

const verifySingnature = async (signature: string) => {
    try {
        jwt.verify(
            signature,
            config.easyship.easyship_api_key as Secret,
            {
                algorithms: ["HS256"],
            }
        ) as JwtPayload;

        return true;
    } catch (err) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Invalid signature. Please check the signature and try again',
        );
    }
}

type EventPayload = {
    event_type: string;
    data: {
        easyship_shipment_id: string;
        status?: string;
        tracking_number?: string;
        tracking_page_url?: string;
    }
}

export const webhookShipmet = async (signature: string, body: EventPayload) => {

    await verifySingnature(signature);

    const { event_type, data } = body;

    const statusChangedEvent = "shipment.tracking.status.changed";
    const canceledEvent = "shipment.cancelled";

    // Only process events that are relevant to shipment status changes or cancellations
    if (event_type != statusChangedEvent && event_type != canceledEvent) {
        return;
    }

    let status: ShipmentStatus | undefined = undefined;

    if (event_type == statusChangedEvent) {
        status = mapEasyshipStatus(data.status);
    } else if (event_type == canceledEvent) {
        status = ShipmentStatus.CANCELLED;
    }

    //if no status exist then return without doing anything
    if (!status) {
        return;
    }

    //update shipment status in database
    const shipments = await prisma.$transaction(async (tx) => {

        const where = { shippingId: data?.easyship_shipment_id };

        // 1. Get the IDs of the shipments that will be updated
        const shipments = await tx.shipment.findMany({
            where,
            select: {
                id: true,
                user: {
                    select: {
                        fcmToken: true,
                        id: true
                    }
                }
            },
        });

        // 2. Update them
        await tx.shipment.updateMany({
            where,
            data: {
                status: status,
                trackingNumber: data?.tracking_number,
                trackingUrl: data?.tracking_page_url,
            },
        });

        for (const shipment of shipments) {
            await tx.shipmentEvent.create({
                data: {
                    shipmentId: shipment.id,
                    shipmentStatus: status,
                    eventType: data.status || event_type,
                    eventTime: new Date(),
                }
            })
        }

        return shipments;

    })

    // const fcmTokens = shipments.map(shipment => shipment.user.fcmToken).filter(token => token !== null);

    // const notifications = shipments.map(shipment => ({
    //     return {
    //         title: ``,
    //         message: `Authentication center has marked your placed **${order?.orderNumber}** order as **Received** for verification. `,
    //         actorId: order?.buyerId,
    //         receiverId: order?.buyerId,
    //         fcmToken: order?.buyer?.fcmToken,
    //         entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
    //         entityId: orderId,
    //         entityType: "ORDER",
    //         type: "ORDER_AUTH_STATUS_CHANGED",
    //         groupKeyId: null,
    //     }
    // }))

    return "Shipment status updated successfully";
}

export const shipmentService = {
    webhookShipmet
}