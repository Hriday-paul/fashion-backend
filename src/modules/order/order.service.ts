import { CancelledBy, CurrentShipTo, OrderAuthStatus } from "../../../generated/prisma/browser";
import { CancelReason, OrderItem, OrderStatus, Prisma, Product, SellDonation } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { DistributePaymentQueue } from "../../queues/payment.queue";
import prisma from "../../shared/prisma";
import httpStatus from "http-status"
import generateRandomString from "../../utils/generateRandomString";
import { createCheckoutSession } from "../payments/payments.utils";
import config from "../../config";
import { ILabel, IShipment } from "./order.interface";
import { RefundQueue } from "../../queues/refund.queue";
import { jobs } from "../../queues/jobs.name";
import { BadgeGenerateQueue } from "../../queues/badge.queue";
import crypto from "crypto";

const truncate = (value: string | null, max = 32) => {
    return value?.trim().slice(0, max) || "";
};

const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `#${timestamp}-${random}`;
};

const addNewOrder = async (
    // payload: Order & { products: PayloadItem[] },
    payload: {
        cartGroupId: string,
        shipmentServiceId: string,
        allowedAuthentication: boolean,
        treeGiftCount: number
    },
    userId: string
) => {

    const cartgroup = await prisma.cartGroup.findFirst({
        where: {
            id: payload.cartGroupId,
            userId
        },
        include: {
            items: {
                include: {
                    charities: true,
                    product: {
                        select: {
                            isDeleted: true,
                            title: true,
                            finalPrice: true,
                            id: true,
                            charities: {
                                select: {
                                    charityId: true,
                                    isAnonymous: true,
                                },
                            },
                            userId: true, // sellerId
                            donation_percent: true,
                            stock: true,
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            hight_cm: true,
                            width_cm: true,
                            length_cm: true,
                            weight_kg: true,
                        }
                    }
                },

            },
            seller: {
                include: {
                    bundleDiscount: {
                        include: {
                            tiers: {
                                select: {
                                    discountPercent: true,
                                    itemCount: true
                                }
                            }
                        }
                    }
                }
            },
            user: true
        }
    })

    if (!cartgroup) {
        throw new AppError(httpStatus.NOT_FOUND, "Checkout cart does not exist")
    }

    //check cart owner is the current user
    if (cartgroup?.userId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the owner of this cart")
    }

    //buyer billing details is required to place order
    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        throw new AppError(httpStatus.NOT_FOUND, "Shiping details is required")
    }

    //seller billing details is required to place order
    const sellerDetails = await prisma.billingDetails.findFirst({ where: { sellerId: cartgroup?.sellerId } });

    if (!sellerDetails) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller location does not exist for place shipment");
    }


    //Validate cart products' charities belong to the product
    for (const payloadItem of cartgroup.items) {
        const dbProduct = payloadItem?.product;

        // Validate all products have enough stock
        if (dbProduct.stock < payloadItem.quantity) {
            throw new AppError(httpStatus.BAD_REQUEST,
                dbProduct.stock === 0
                    ? `"${payloadItem.product?.title}" is out of stock`
                    : `Only ${dbProduct.stock} unit(s) of "${payloadItem.product?.title}" left in stock`
            );
        }

        if (dbProduct.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `"${payloadItem.product?.title}" is no longer available`
            );
        }

        const allowedCharityIds = dbProduct.charities.map((c) => c.charityId);

        if (!allowedCharityIds.length) continue;

        // ✅ At least 1 charity required if have At least 1 charity to the product
        if (payloadItem.charities?.length === 0 && dbProduct.donation_percent > 0) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `At least one charity is required for ${payloadItem?.product?.title}`
            );
        }

        // ✅ All provided charities must exist in the product
        const invalidCharities = payloadItem.charities.filter(
            (charity) => !allowedCharityIds.includes(charity?.charityId)
        );

        if (invalidCharities.length > 0) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `Invalid charities [${invalidCharities.join(', ')}] for product ${payloadItem?.product?.title}`
            );
        }
    }

    const itemCount = cartgroup.items.length;

    const bundleDiscountTiers = cartgroup?.seller?.bundleDiscount?.tiers || [];

    const nearestTier = bundleDiscountTiers
        .filter(tier => itemCount >= (tier.itemCount ?? 0))
        .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

    const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;


    const orderItems = cartgroup.items.map((item) => {
        const p = item?.product;
        const donation_percent = p.donation_percent || 0;
        const extra_donation = item.extraDonation || 0;

        const unit_price = p?.finalPrice;
        const allocateUnitPrice = p?.finalPrice - (p?.finalPrice * (bundleDiscountPercent / 100));

        const quantity = item.quantity || 1;

        const donation_amount = (allocateUnitPrice * (donation_percent / 100));

        return {
            product: p,
            productId: p.id,
            sellerId: p.userId,
            unitPrice: unit_price,
            unitAllocatedPrice: allocateUnitPrice,
            sellerFinalUnitPrice: allocateUnitPrice - donation_amount,
            totalPrice: allocateUnitPrice + extra_donation,
            quantity,
            extra_donation,
            donation_percent, // how much percent of the product price will be donated to charity from seller
            donation_amount, // how much amount of the product price will be donated to charity from seller
            charities: item?.charities ?? [],
        };
    });

    const serviceFeeCost = 2.30; // fixed service fee cost
    const authenTicationRate = 15; // fixed authentication cost per item
    const treeGiftRate = 4; // fixed tree gift cost per item

    const totalAuthenticationCost = payload?.allowedAuthentication ? itemCount * authenTicationRate : 0;

    const treeGiftCost = payload?.treeGiftCount * treeGiftRate; // fixed tree gift cost per item

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.unitAllocatedPrice, 0);
    const otherTotal = serviceFeeCost + treeGiftCost + totalAuthenticationCost;

    const totalExtraDonation = cartgroup.items.reduce((acc, item) => acc + (item.extraDonation || 0), 0);

    const sellerTotal = orderItems.reduce((acc, item) => acc + item?.sellerFinalUnitPrice, 0)

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": cartgroup?.seller?.fname,
            "contact_phone": cartgroup?.seller?.phone,
            "contact_email": cartgroup?.seller?.email
        },
        "destination_address": {
            "line_1": truncate(billing_details?.address1),
            "line_2": truncate(billing_details?.address2),
            "city": truncate(billing_details?.city, 20),
            "state": truncate(billing_details?.state, 20),
            "postal_code": truncate(billing_details?.zip_code, 10),
            "country_alpha2": billing_details?.countryCode,
            "contact_name": billing_details?.full_name,
            "contact_phone": billing_details?.contact,
            "contact_email": billing_details?.email
        },
        "return": false,
        "incoterms": "DDP",
        "order_data": {
            "platform_name": "FASHION",
        },
        "courier_settings": {
            "courier_service_id": payload?.shipmentServiceId
        },
        "shipping_settings": {
            "units": {
                "weight": "kg",
                "dimensions": "cm"
            },
            "output_currency": "USD"
        },
        "parcels": [
            {
                "items": orderItems?.map((item) => {
                    return {
                        "description": truncate(item?.product?.title, 64) || "Fashion Product",
                        "category": "fashion",
                        "origin_country_alpha2": sellerDetails?.countryCode,
                        "quantity": 1,
                        "dimensions": {
                            "height": item?.product?.hight_cm,
                            "width": item?.product?.width_cm,
                            "length": item?.product?.length_cm
                        },
                        "actual_weight": item?.product?.weight_kg,
                        "declared_currency": "USD",
                        "declared_customs_value": item?.product?.finalPrice || 0,
                    }

                }),
            }
        ]
    }

    const shipmentRes = await fetch(`${config.easyship.easyship_base_url}/shipments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!shipmentRes.ok) {
        const errorData = await shipmentRes.json().catch(() => null);

        console.log(errorData)

        throw new AppError(httpStatus.BAD_REQUEST, errorData?.error?.message || "Shipment creation failed");
    }

    const shipmentData = await shipmentRes.json() as IShipment;

    const shippingRate = shipmentData?.shipment?.rates.find(rate => rate?.courier_service?.id === payload?.shipmentServiceId)?.total_charge;

    if (!shippingRate) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipping rate not available for the selected courier service");
    }

    const total = discountedItemTotal + otherTotal + totalExtraDonation + shippingRate;

    const parcelId = shipmentData?.shipment?.parcels[0]?.id;

    const shipmentItems = shipmentData?.shipment?.parcels[0]?.items || [];

    const treeCredit = treeGiftCost;

    const tranId = generateRandomString(10);

    const result = await prisma.$transaction(async (transactionClient) => {

        //create new order for this cart group
        const order = await transactionClient.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                totalPrice: total,
                itemsTotal: discountedItemTotal,
                treeCredit: treeCredit ?? 0,
                buyerId: userId,
                billingId: billing_details?.id,
                sellerId: orderItems[0]?.sellerId,
                sellerItemsTotal: discountedItemTotal,
                sellerTotal: sellerTotal,
                bundleDiscountPercent,
                courier_service_id: payload?.shipmentServiceId,

                authenticationFee: totalAuthenticationCost,

                serviceFee: serviceFeeCost,

                parcelId,

                pricingSource: "BUNDLE",

                currentShipTo: payload?.allowedAuthentication ? "AUTHENTICATION_CENTER" : "BUYER",

                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                deliveryCharge: {
                    create: {
                        baseCharge: shippingRate,
                        discount: 0,
                        finalCharge: shippingRate,
                        status: "UNPAID",
                        totalItems: orderItems?.length || 0,
                        totalWeight: orderItems?.reduce((acc, item) => acc + (item?.product?.weight_kg || 0), 0),
                    }
                },
                totalDelivery: shippingRate,
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            parcelItemId,
                            sell_donation: donation_amount,
                            ...(charityCount > 0 && {
                                donations: {
                                    create: charities.map((charity) => {

                                        const productCharity = dbProduct.charities.find(
                                            (c) => c.charityId === charity?.charityId
                                        )!;

                                        return {
                                            charityId: charity?.charityId,
                                            amount: splitAmount,
                                            percent: splitPercent,
                                            extra_money: splitExtra,
                                            total_amount: splitAmount + splitExtra,
                                            status: 'PENDING',
                                            isAnonymous: productCharity?.isAnonymous,
                                        };
                                    }),
                                },
                            }),

                        };
                    })
                },
            },
        });

        //create new payment for this cart group
        const createdPayment = await transactionClient.payment.create({
            data: {
                userId,
                total_amount: total,
                paid_amount: 0,
                seller_required_amount: sellerTotal,
                seller_received_amount: 0,
                status: "PENDING",
                stripe_status: "PENDING",
                orderId: order?.id,
                transactionId: tranId,
            },
            include: {
                user: true
            }
        })

        //dlt the cart group after order created
        await transactionClient.cartGroup.delete({
            where: {
                id: payload?.cartGroupId
            }
        });

        return createdPayment;

    });

    const total_extra_donation = cartgroup.items.reduce((itemSum, item) => itemSum + (item?.extraDonation ?? 0), 0);

    const checkOutSessionItems = [
        ...orderItems.map((item) => {
            const p = item?.product;
            return {
                amount: item?.unitAllocatedPrice,
                images: p?.images.map(img => img?.url),
                name: p?.title,
                quantity: 1,
            }
        })
    ];

    if (total_extra_donation > 0) {
        checkOutSessionItems.push({
            amount: total_extra_donation,
            images: [],
            name: "Extra Donation",
            quantity: 1,
        })
    }

    if (treeGiftCost > 0) {
        checkOutSessionItems.push({
            amount: treeGiftCost,
            images: [],
            name: "Tree plantation cost",
            quantity: 1,
        })
    }

    if (totalAuthenticationCost > 0) {
        checkOutSessionItems.push({
            amount: totalAuthenticationCost,
            images: [],
            name: "Authentication & Quality Control",
            quantity: 1,
        })
    }

    checkOutSessionItems.push(
        {
            amount: 2.30,
            images: [],
            name: "Service Fee",
            quantity: 1,
        }
    );

    // build delivery charge line item
    const totalDeliveryCharge = shippingRate;

    if (totalDeliveryCharge > 0) {

        checkOutSessionItems.push({
            amount: totalDeliveryCharge,
            images: [],
            name: "Delivery Charge",
            quantity: 1,
        });
    }

    // generate payment link
    const checkoutSession = await createCheckoutSession({
        // customerId: customer.id,
        products: checkOutSessionItems,
        user: cartgroup?.user,
        paymentId: result?.id
    });

    return checkoutSession?.url

}

const addNewOfferOrder = async (
    // payload: Order & { products: PayloadItem[] },
    payload: {
        offerId: string,
        shipmentServiceId: string,
        allowedAuthentication: boolean,
        treeGiftCount: number
    },
    userId: string) => {

    const offer = await prisma.offer.findFirst({
        where: {
            id: payload.offerId,
            buyerId: userId
        },
        include: {
            offerItems: {
                include: {
                    product: {
                        select: {
                            isDeleted: true,
                            title: true,
                            finalPrice: true,
                            id: true,
                            charities: {
                                select: {
                                    charityId: true,
                                    isAnonymous: true,
                                },
                            },
                            userId: true, // sellerId
                            donation_percent: true,
                            stock: true,
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            hight_cm: true,
                            width_cm: true,
                            length_cm: true,
                            weight_kg: true,


                        }
                    },
                }
            },
            buyer: true,
            seller: true
        }
    })

    if (!offer) {
        throw new AppError(httpStatus.NOT_FOUND, "Offer does not exist")
    }

    //offer is not accepted yet
    if (offer?.status !== "ACCEPTED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is not accepted yet")
    }

    //offer is already expired
    if (!offer?.expiredAt || offer?.expiredAt < new Date()) {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is already expired")
    }

    //check offer owner is the current user
    if (offer?.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the owner of this offer")
    }

    //buyer billing details is required to place order
    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        throw new AppError(httpStatus.NOT_FOUND, "Shiping details is required")
    }

    //seller billing details is required to place order
    const sellerDetails = await prisma.billingDetails.findFirst({ where: { sellerId: offer?.sellerId } });

    if (!sellerDetails) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller location does not exist for place shipment");
    }


    //Validate products stock and availability'
    for (const payloadItem of offer.offerItems) {
        const dbProduct = payloadItem?.product;

        // Validate all products have enough stock
        if (dbProduct.stock < payloadItem.quantity) {
            throw new AppError(httpStatus.BAD_REQUEST,
                dbProduct.stock === 0
                    ? `"${payloadItem.product?.title}" is out of stock`
                    : `Only ${dbProduct.stock} unit(s) of "${payloadItem.product?.title}" left in stock`
            );
        }

        if (dbProduct.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST,
                `"${payloadItem.product?.title}" is no longer available`
            );
        }
    }

    const itemCount = offer.offerItems.length;
    const itemsTotalPrice = offer?.offerItems.reduce((acc, item) => acc + item.product?.finalPrice, 0);

    const orderItems = offer.offerItems.map((item) => {
        const p = item?.product;
        const donation_percent = p.donation_percent || 0;
        const extra_donation = 0;
        const unit_price = p?.finalPrice;

        const itemRatio = unit_price / itemsTotalPrice;

        const allocateUnitPrice = offer?.offeredPrice * itemRatio;

        const donation_amount = (allocateUnitPrice * (donation_percent / 100));

        const quantity = item.quantity || 1;

        return {
            product: p,
            productId: p.id,
            sellerId: p.userId,
            unitPrice: unit_price,
            unitAllocatedPrice: allocateUnitPrice,
            sellerFinalUnitPrice: allocateUnitPrice - donation_amount,
            totalPrice: allocateUnitPrice + extra_donation,
            quantity,
            extra_donation,
            donation_percent, // how much percent of the product price will be donated to charity from seller
            donation_amount, // how much amount of the product price will be donated to charity from seller
            charities: p?.charities,
        };
    });

    const serviceFeeCost = 2.30; // fixed service fee cost
    const authenTicationRate = 15; // fixed authentication cost per item
    const treeGiftRate = 4; // fixed tree gift cost per item

    const totalAuthenticationCost = payload?.allowedAuthentication ? itemCount * authenTicationRate : 0;

    const treeGiftCost = payload?.treeGiftCount * treeGiftRate; // fixed tree gift cost per item

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.unitAllocatedPrice, 0);
    const otherTotal = serviceFeeCost + treeGiftCost + totalAuthenticationCost;

    const totalExtraDonation = 0;

    const sellerTotal = orderItems.reduce((acc, item) => acc + item?.sellerFinalUnitPrice, 0);

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": offer?.seller?.fname,
            "contact_phone": offer?.seller?.phone,
            "contact_email": offer?.seller?.email
        },
        "destination_address": {
            "line_1": truncate(billing_details?.address1),
            "line_2": truncate(billing_details?.address2),
            "city": truncate(billing_details?.city, 20),
            "state": truncate(billing_details?.state, 20),
            "postal_code": truncate(billing_details?.zip_code, 10),
            "country_alpha2": billing_details?.countryCode,
            "contact_name": billing_details?.full_name,
            "contact_phone": billing_details?.contact,
            "contact_email": billing_details?.email
        },
        "return": false,
        "incoterms": "DDP",
        "order_data": {
            "platform_name": "FASHION",
        },
        "courier_settings": {
            "courier_service_id": payload?.shipmentServiceId
        },
        "shipping_settings": {
            "units": {
                "weight": "kg",
                "dimensions": "cm"
            },
            "output_currency": "USD"
        },
        "parcels": [
            {
                "items": orderItems?.map((item) => {
                    return {
                        "description": truncate(item?.product?.title, 64) || "Fashion Product",
                        "category": "fashion",
                        "origin_country_alpha2": sellerDetails?.countryCode,
                        "quantity": 1,
                        "dimensions": {
                            "height": item?.product?.hight_cm,
                            "width": item?.product?.width_cm,
                            "length": item?.product?.length_cm
                        },
                        "actual_weight": item?.product?.weight_kg,
                        "declared_currency": "USD",
                        "declared_customs_value": item?.product?.finalPrice || 0,
                    }

                }),
            }
        ]
    }

    const shipmentRes = await fetch(`${config.easyship.easyship_base_url}/shipments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!shipmentRes.ok) {
        const errorData = await shipmentRes.json().catch(() => null);

        console.log(errorData)

        throw new AppError(httpStatus.BAD_REQUEST, errorData?.error?.message || "Shipment creation failed");
    }

    const shipmentData = await shipmentRes.json() as IShipment;

    const shippingRate = shipmentData?.shipment?.rates.find(rate => rate?.courier_service?.id === payload?.shipmentServiceId)?.total_charge;

    if (!shippingRate) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipping rate not available for the selected courier service");
    }

    const total = offer?.offeredPrice + otherTotal + totalExtraDonation + shippingRate;

    const parcelId = shipmentData?.shipment?.parcels[0]?.id;

    const shipmentItems = shipmentData?.shipment?.parcels[0]?.items || [];

    const treeCredit = treeGiftCost;

    const tranId = generateRandomString(10);

    const result = await prisma.$transaction(async (transactionClient) => {

        //create new order for this cart group
        const order = await transactionClient.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                totalPrice: total,
                itemsTotal: discountedItemTotal,
                treeCredit: treeCredit ?? 0,
                buyerId: userId,
                billingId: billing_details?.id,
                sellerId: orderItems[0]?.sellerId,
                sellerItemsTotal: offer?.offeredPrice,
                sellerTotal,
                bundleDiscountPercent: 0,
                courier_service_id: payload?.shipmentServiceId,

                parcelId,
                authenticationFee: totalAuthenticationCost,
                serviceFee: serviceFeeCost,

                pricingSource: "OFFER",

                currentShipTo: payload?.allowedAuthentication ? "AUTHENTICATION_CENTER" : "BUYER",

                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                deliveryCharge: {
                    create: {
                        baseCharge: shippingRate,
                        discount: 0,
                        finalCharge: shippingRate,
                        status: "UNPAID",
                        totalItems: orderItems?.length || 0,
                        totalWeight: orderItems?.reduce((acc, item) => acc + (item?.product?.weight_kg || 0), 0),
                    }
                },
                totalDelivery: shippingRate,
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            sell_donation: donation_amount,
                            parcelItemId,
                            ...(charityCount > 0 && {
                                donations: {
                                    create: charities.map((charity) => {

                                        const productCharity = dbProduct.charities.find(
                                            (c) => c.charityId === charity?.charityId
                                        )!;

                                        return {
                                            charityId: charity?.charityId,
                                            amount: splitAmount,
                                            percent: splitPercent,
                                            extra_money: splitExtra,
                                            total_amount: splitAmount + splitExtra,
                                            status: 'PENDING',
                                            isAnonymous: productCharity?.isAnonymous,
                                        };
                                    }),
                                },
                            }),

                        };
                    })
                },
            },
        });

        //create new payment for this cart group
        const createdPayment = await transactionClient.payment.create({
            data: {
                userId,
                total_amount: total,
                paid_amount: 0,
                seller_required_amount: sellerTotal,
                seller_received_amount: 0,
                status: "PENDING",
                stripe_status: "PENDING",
                orderId: order?.id,
                transactionId: tranId,
            },
            include: {
                user: true
            }
        })

        return createdPayment;

    });

    const checkOutSessionItems = [
        ...orderItems.map((item) => {
            const p = item?.product;
            return {
                amount: item?.unitAllocatedPrice,
                images: p?.images.map(img => img?.url),
                name: p?.title,
                quantity: 1,
            }
        })
    ];

    if (treeGiftCost > 0) {
        checkOutSessionItems.push({
            amount: treeGiftCost,
            images: [],
            name: "Tree plantation cost",
            quantity: 1,
        })
    }

    if (totalAuthenticationCost > 0) {
        checkOutSessionItems.push({
            amount: totalAuthenticationCost,
            images: [],
            name: "Authentication & Quality Control",
            quantity: 1,
        })
    }

    checkOutSessionItems.push(
        {
            amount: 2.30,
            images: [],
            name: "Service Fee",
            quantity: 1,
        }
    );


    // build delivery charge line item
    const totalDeliveryCharge = shippingRate;

    if (totalDeliveryCharge > 0) {

        checkOutSessionItems.push({
            amount: totalDeliveryCharge,
            images: [],
            name: "Delivery Charge",
            quantity: 1,
        });
    }

    // generate payment link
    const checkoutSession = await createCheckoutSession({
        // customerId: customer.id,
        products: checkOutSessionItems,
        user: offer?.buyer,
        paymentId: result?.id
    });

    return checkoutSession?.url

}

const requestCancelOrderItem = async (payload: { orderId: string, itemIds: string[], cancelReason: string, cancelReasonDescription: string, cancelEvidences: { key: string, url: string }[] }, userId: string) => {

    const { itemIds, orderId, cancelEvidences, cancelReason, cancelReasonDescription } = payload;

    const order = await prisma.order.findFirst({
        where: {
            id: orderId
        },
        include: {
            items: {
                where: {
                    id: {
                        notIn: itemIds,
                    },
                    isCancelled: false
                }
            }
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the buyer of this order")
    }
    if (order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check allow to cancel
    const isDirectToBuyer =
        order.authStatus === OrderAuthStatus.NOT_STARTED &&
        order.currentShipTo === CurrentShipTo.BUYER;

    const isAuthRound =
        order.currentShipTo === CurrentShipTo.AUTHENTICATION_CENTER;

    const canCancel =
        order.status === OrderStatus.PENDING &&
        (isDirectToBuyer || isAuthRound);

    if (!canCancel) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Unable to process cancel the order items"
        );
    }

    //check all of items belongs to the order and not cancelled
    const orderItems = await prisma.orderItem.findMany({
        where: {
            id: {
                in: itemIds
            },
            orderId: orderId,
            isCancelled: false,
            buyerRequestCancel: "NOT_REQUESTED"
        },
        include: {
            product: true
        }
    })

    if (orderItems.length !== itemIds.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "Some of the order items are already cancelled or requested to cancel or does not belong to this order")
    }

    await prisma.$transaction(async (transactionClient) => {

        //mark the order items as cancel requested by buyer
        await transactionClient.orderItem.updateMany({
            where: {
                id: {
                    in: itemIds
                }
            },
            data: {
                buyerRequestCancel: "REQUESTED",
                cancellationRequestAt: new Date(),
                cancelledBy: "BUYER",
                cancelReason: cancelReason as CancelReason,
                cancelReasonDetails: cancelReasonDescription,
            }
        })

        const ids = orderItems.map(item => item.id);

        //create cancel evidence group for the order
        await transactionClient.cancelOrderEvidence.createMany({
            data: ids.flatMap(itemId => {
                return cancelEvidences.map(e => {
                    return {
                        itemId: itemId,
                        key: e?.key,
                        url: e?.url,
                    }
                })
            })
        })

    })

}

const approveCancelOrderItemBySeller = async (orderItemId: string, current_sellerId: string) => {

    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: orderItemId,
        },
        include: {
            order: {
                include: {
                    payment: true
                }
            },
            donations: true
        }
    })

    if (!orderItem) {
        throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist")
    }

    // you are not the seller of this order item
    if (orderItem?.order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order item")
    }

    //check if the order item is already cancelled
    if (orderItem?.isCancelled) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order item is already cancelled")
    }

    if (orderItem?.order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check is requested by buyer to cancel the order item
    if (orderItem?.buyerRequestCancel !== "REQUESTED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Does not have a request to cancel the order item from buyer")
    }

    const order = orderItem?.order;

    //check allow to cancel
    const isDirectToBuyer =
        order.authStatus === OrderAuthStatus.NOT_STARTED &&
        order.currentShipTo === CurrentShipTo.BUYER;

    const isAuthRound =
        order.currentShipTo === CurrentShipTo.AUTHENTICATION_CENTER;

    const canCancel =
        order.status === OrderStatus.PENDING &&
        (isDirectToBuyer || isAuthRound);

    if (!canCancel) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Unable to process cancel the order items"
        );
    }

    if (!order?.payment || !order?.payment?.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment not found for this order")
    }

    //count how many items available to the order that not cancelled, without the current order item
    const availableItems = await prisma.orderItem.findMany({
        where: {
            orderId: order?.id,
            isCancelled: false,
            id: {
                not: orderItemId
            }
        },
        include: {
            product: true
        }
    })

    const refundAmount = orderItem?.unitPrice;

    //if the available items count is 0, then cancel the whole order
    if (availableItems.length === 0 && order?.isLebelGenerated) {
        await cancelFullOrderShipment({
            shipment_id: order?.shippingId,
            orderId: order?.id,
            cancelReason: orderItem?.cancelReason || "OTHER",
            cancelReasonDescription: orderItem?.cancelReasonDetails || "Cancelled by Buyer request",
            cancelEvidences: [],
            items: [orderItem],
            price: {
                buyerTotalNow: order?.totalPrice - order?.itemsTotal,
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: orderItem?.cancelledBy || "BUYER"
        });
    } else if (availableItems.length === 0) {

        await dltOrderShipment({
            shipment_id: order?.shippingId,
            orderId: order?.id,
            cancelReason: orderItem?.cancelReason || "OTHER",
            cancelReasonDescription: orderItem?.cancelReasonDetails || "Cancelled by Buyer request",
            cancelEvidences: [],
            items: [orderItem],
            price: {
                buyerTotalNow: order?.totalPrice - order?.itemsTotal,
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: orderItem?.cancelledBy || "BUYER"
        });

    } else {


        if (order?.parcelId) {
            //update the shipment to remove the cancelled items
            await updateOrderShipment({ shipment_id: order?.shippingId, orderItems: availableItems, parcelId: order?.parcelId });
        }

        await prisma.$transaction(async (transactionClient) => {

            //recalculate prices
            await transactionClient.order.update({
                where: {
                    id: order?.id
                },
                data: {
                    totalPrice: order?.totalPrice - refundAmount,
                    sellerTotal: order?.sellerTotal - refundAmount,
                    itemsTotal: order?.itemsTotal - refundAmount,
                    sellerItemsTotal: order?.sellerItemsTotal - refundAmount
                }
            });

            //mark the order items as cancelled
            await transactionClient.orderItem.update({
                where: {
                    id: orderItemId
                },
                data: {
                    isCancelled: true,
                    cancelledAt: new Date(),
                }
            })

            //update sell donations
            await transactionClient.sellDonation.updateMany({
                where: {
                    orderItemId: orderItemId
                },
                data: orderItem?.donations?.map(donation => {
                    return {
                        amount: 0,
                        percent: 0,
                        total_amount: donation?.extra_money,
                    }
                })
            })

        })

    }

    const paymentId = order?.payment?.id;
    const paymentIntentId = order?.payment?.paymentIntentId;

    await RefundQueue.add(jobs.refund, {
        paymentId,
        paymentIntentId,
        reason: "Order item canceled for requested from buyer",
        triggeredBy: "Seller",
        markPaymentRefunded: false,
        amount: refundAmount
    });

    return;
}

const declineCancelOrderItemBySeller = async (orderItemId: string, current_sellerId: string) => {

    const orderItem = await prisma.orderItem.findFirst({
        where: {
            id: orderItemId,
        },
        include: {
            order: true
        }
    })

    if (!orderItem) {
        throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist")
    }

    // you are not the seller of this order item
    if (orderItem?.order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order item")
    }

    //check if the order item is already cancelled
    if (orderItem?.isCancelled) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order item is already cancelled")
    }

    if (orderItem?.order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check is requested by buyer to cancel the order item
    if (orderItem?.buyerRequestCancel !== "REQUESTED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Does not have a request to cancel the order item from buyer")
    }

    await prisma.orderItem.update({
        where: {
            id: orderItemId
        },
        data: {
            buyerRequestCancel: "REJECTED"
        }
    })

    return;
}

const confirmOrderReceived = async (orderId: string, userId: string) => {
    //check exist order received
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        include: {
            items: {
                select: {
                    isCancelled: true,
                    id: true
                }
            },
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found")
    }

    if (order?.status !== "DELIVERED" || order?.currentShipTo !== "BUYER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process confirm order received")
    }

    //check current user is the buyer of the order
    if (order?.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the buyer of this order")
    }

    // //mark order received
    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "COMPLETED"
        }
    })

    // distribute the payment
    // await DistributePaymentQueue.add(
    //     "distribute-payment",
    //     { orderSellerGroupId },
    //     {
    //         jobId: order?.id,
    //         removeOnComplete: true,
    //     }
    // );

}

const ordersAsASeller = async (sellerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.OrderWhereInput[] = [{
        sellerId, assistentSellId: null, payment: {
            status: {
                in: ["SUCCESSED", "REFUNDED"]
            }
        }
    }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

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
                {
                    billingDetails: {
                        OR: [
                            {
                                full_name: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                contact: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                email: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address1: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address2: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            }
                        ]
                    }
                },
                {
                    items: {
                        some: {
                            product: {
                                OR: [
                                    {
                                        title: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },
                                    {
                                        description: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        }
                                    },
                                    {
                                        id: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },

                                ]
                            },
                        }
                    }
                },
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as OrderStatus
        })
    }

    const whereConditions: Prisma.OrderWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            title: true,
                            description: true,
                            id: true,
                            condition: true,
                            finalPrice: true,
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            category: {
                                select: {
                                    name: true
                                }
                            },
                            size: {
                                select: {
                                    title: true
                                }
                            },
                            _count: true
                        },
                    },
                    returnItem: {
                        include: {

                        }
                    },
                    cancelEvidences: true
                }
            },

            buyer: {
                select: {
                    userName: true,
                }
            },
            billingDetails: true
        },
    })

    const total = await prisma.order.count({
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

const ordersAsABuyer = async (buyerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.OrderWhereInput[] = [{
        buyerId, assistentSellId: null, payment: {
            status: {
                in: ["SUCCESSED", "REFUNDED"]
            }
        }
    }];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status } = query;

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
                {
                    billingDetails: {
                        OR: [
                            {
                                full_name: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                },
                            },
                            {
                                contact: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                email: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address1: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            },
                            {
                                address2: {
                                    contains: searchTerm as string,
                                    mode: "insensitive",
                                }
                            }
                        ]
                    }
                },
                {
                    items: {
                        some: {
                            product: {
                                OR: [
                                    {
                                        title: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },
                                    {
                                        description: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        }
                                    },
                                    {
                                        id: {
                                            contains: searchTerm as string,
                                            mode: "insensitive",
                                        },
                                    },

                                ]
                            },
                        }
                    }
                },
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as OrderStatus
        })
    }

    const whereConditions: Prisma.OrderWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            title: true,
                            description: true,
                            id: true,
                            condition: true,
                            finalPrice: true,
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            category: {
                                select: {
                                    name: true
                                }
                            },
                            size: {
                                select: {
                                    title: true
                                }
                            },
                            _count: true
                        },
                    },
                    returnItem: true,
                    cancelEvidences: true
                }
            },
            seller: {
                select: {
                    userName: true,
                }
            },
            billingDetails: true
        },
    })

    const total = await prisma.order.count({
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

const markShippedOrder = async (orderId: string, current_sellerId: string) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        include: {
            items: true,
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.status !== "PENDING") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to process mark as shipped the order")
    }

    if (order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }

    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "SHIPPED"
        }
    })

    return;

}

const createLebelForOrder = async ({ shipment_id, orderId }: { orderId: string, shipment_id: string }) => {

    const payload = {
        "printing_options": {
            "format": "url"
        },
    }

    const rateRes = await fetch(`${config.easyship.easyship_base_url}/shipments/${shipment_id}/label`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => null);

        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Lebel generation failed',
        );
    }

    const data = await rateRes.json() as ILabel;

    const labelDoc = data?.shipment?.shipping_documents?.find(doc => doc.category === "label");

    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            lebelUrl: labelDoc?.url,
            isLebelGenerated: true
        }
    })

    return labelDoc?.url || null;
}

const getShipingLebel = async (orderId: string, current_sellerId: string) => {
    const order = await prisma.order.findFirst({ where: { id: orderId } });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.status == "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is cancelled, unable to generate label")
    }

    if (order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }

    if (order?.lebelUrl) {
        return order?.lebelUrl;
    }

    else if (order?.isLebelGenerated) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label already generated but not found, please contact support")
    }

    const labelUrl = await createLebelForOrder({ shipment_id: order?.shippingId, orderId: order?.id });

    if (!labelUrl) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label generated but not found, please contact support")
    }

    return labelUrl;
}

interface ItemWithDonation extends OrderItem {
    donations: SellDonation[]
}

type CancelOrderShipmentPayload = {
    shipment_id: string,
    orderId: string,
    items: ItemWithDonation[],
    cancelReason: string,
    cancelReasonDescription: string,
    cancelEvidences: { key: string, url: string }[],
    cancelledBy: CancelledBy
    price: {
        buyerTotalNow: number,
        sellerTotalNow: number,
    }
}

const cancelFullOrderShipment = async ({ shipment_id, orderId, items, cancelReason, cancelReasonDescription, cancelEvidences, price, cancelledBy }: CancelOrderShipmentPayload) => {

    const shipRes = await fetch(`${config.easyship.easyship_base_url}/shipments/${shipment_id}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        // body: JSON.stringify(payload)
    });

    if (!shipRes.ok) {
        const errorData = await shipRes.json().catch(() => null);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Order shipment cancel failed',
        );
    }

    // const data = await rateRes.json();

    await prisma.$transaction(async (transactionClient) => {

        //mark order as cancelled to the database
        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                status: "CANCELLED",
                totalPrice: price?.buyerTotalNow,
                itemsTotal: 0,
                sellerItemsTotal: 0,
                sellerTotal: price?.sellerTotalNow
            }
        })

        //mark all order items as cancelled
        await transactionClient.orderItem.updateMany({
            where: {
                orderId: orderId,
                isCancelled: false
            },
            data: {
                isCancelled: true,
                cancelReason: cancelReason as CancelReason,
                cancelReasonDetails: cancelReasonDescription,
                cancelledBy,
                cancelledAt: new Date(),
            },
        })

        const itemIds = items.map(item => item?.id);

        //create cancel evidence group for the order
        await transactionClient.cancelOrderEvidence.createMany({
            data: itemIds.flatMap(itemId => {
                return cancelEvidences.map(e => {
                    return {
                        itemId: itemId,
                        key: e?.key,
                        url: e?.url,
                    }
                })
            })
        })

        //update sell donations
        await transactionClient.sellDonation.updateMany({
            where: {
                orderItemId: {
                    in: itemIds
                }
            },
            data: items?.flatMap(item => {
                return item?.donations?.map(donation => {
                    return {
                        amount: 0,
                        percent: 0,
                        total_amount: donation?.extra_money,
                    }
                })
            })
        })


    })

}

const dltOrderShipment = async ({ orderId, shipment_id, items, cancelReason, cancelReasonDescription, cancelEvidences, price, cancelledBy }: CancelOrderShipmentPayload) => {

    const rateRes = await fetch(`${config.easyship.easyship_base_url}/shipments/${shipment_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        // body: JSON.stringify(payload)
    });

    if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => null);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Order shipment deletion failed',
        );
    }

    // const data = await rateRes.json();

    //mark order as cancelled to the database
    await prisma.$transaction(async (transactionClient) => {

        //mark order as cancelled to the database
        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                status: "CANCELLED",
                totalPrice: price?.buyerTotalNow,
                itemsTotal: 0,
                sellerItemsTotal: 0,
                sellerTotal: price?.sellerTotalNow
            }
        })

        //mark all order items as cancelled
        await transactionClient.orderItem.updateMany({
            where: {
                orderId: orderId,
                isCancelled: false
            },
            data: {
                isCancelled: true,
                cancelReason: cancelReason as CancelReason,
                cancelReasonDetails: cancelReasonDescription,
                cancelledBy,
                cancelledAt: new Date(),
            },
        })

        const itemIds = items.map(item => item.id);

        //create cancel evidence group for the order
        await transactionClient.cancelOrderEvidence.createMany({
            data: itemIds.flatMap(itemId => {
                return cancelEvidences.map(e => {
                    return {
                        itemId: itemId,
                        key: e?.key,
                        url: e?.url,
                    }
                })
            })
        })

        //update sell donations
        await transactionClient.sellDonation.updateMany({
            where: {
                orderItemId: {
                    in: itemIds
                }
            },
            data: items?.flatMap(item => {
                return item?.donations?.map(donation => {
                    return {
                        amount: 0,
                        percent: 0,
                        total_amount: donation?.extra_money,
                    }
                })
            })
        })

    })

}

interface Item extends OrderItem {
    product: Product
}

const updateOrderShipment = async ({ orderItems, shipment_id, parcelId }: { shipment_id: string, orderItems: Item[], parcelId: string }) => {

    const filteredItems = orderItems.filter(item => item?.parcelItemId);

    const shipPayload = {
        "parcels": [
            {
                id: parcelId,
                "items": filteredItems?.map((item) => {
                    return {
                        "description": item?.product?.title || "Fashion Product",
                        "id": item?.parcelItemId,
                        "category": "fashion",
                        "quantity": 1,
                        "dimensions": {
                            "height": item?.product?.hight_cm,
                            "width": item?.product?.width_cm,
                            "length": item?.product?.length_cm
                        },
                        "declared_currency": "USD",
                        "declared_customs_value": item?.product?.finalPrice || 0,
                        "actual_weight": item?.product?.weight_kg,
                    }
                })
            }
        ]
    }

    const shipRes = await fetch(`${config.easyship.easyship_base_url}/shipments/${shipment_id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!shipRes.ok) {
        const errorData = await shipRes.json().catch(() => null);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Lebel generation failed',
        );
    }

    const data = await shipRes.json() as IShipment;

    return;

}

const cancelOrderItemBySeller = async (payload: { orderId: string, itemIds: string[], cancelReason: string, cancelReasonDescription: string, cancelEvidences: { key: string, url: string }[] }, current_sellerId: string) => {

    const { orderId, itemIds, cancelEvidences, cancelReason, cancelReasonDescription } = payload;

    const order = await prisma.order.findFirst({
        where: {
            id: orderId
        },
        include: {
            items: {
                where: {
                    id: {
                        notIn: itemIds,
                    },
                    isCancelled: false
                },
                include: {
                    product: true,
                }
            },
            payment: true,
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }
    if (order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check allow to cancel
    const isDirectToBuyer =
        order.authStatus === OrderAuthStatus.NOT_STARTED &&
        order.currentShipTo === CurrentShipTo.BUYER;

    const isAuthRound =
        order.currentShipTo === CurrentShipTo.AUTHENTICATION_CENTER;

    const canCancel =
        order.status === OrderStatus.PENDING &&
        (isDirectToBuyer || isAuthRound);

    if (!canCancel) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Unable to process cancel the order items"
        );
    }

    //check all of items belongs to the order and not cancelled
    const orderItems = await prisma.orderItem.findMany({
        where: {
            id: {
                in: itemIds
            },
            orderId: orderId,
            isCancelled: false,
        },
        include: {
            donations: true
        }
    })

    if (orderItems.length !== itemIds.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "Some of the order items are already cancelled or not belong to this order")
    }

    const allowCancelFullOrder = order?.items?.length === 0;

    const ids = orderItems.map(item => item?.id);

    const refundAmount = orderItems.reduce((acc, item) => acc + (item?.unitPrice || 0), 0);

    if (!order?.payment || !order?.payment?.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment not found for this order, contact support")
    }

    if (allowCancelFullOrder && order?.isLebelGenerated) {
        await cancelFullOrderShipment({
            shipment_id: order?.shippingId,
            orderId: order?.id,
            cancelReason,
            cancelReasonDescription,
            cancelEvidences,
            items: orderItems,
            price: {
                buyerTotalNow: order?.totalPrice - order?.itemsTotal,
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: "SELLER"
        });
    } else if (allowCancelFullOrder) {
        await dltOrderShipment({
            shipment_id: order?.shippingId,
            orderId: order?.id,
            cancelReason,
            cancelReasonDescription,
            cancelEvidences,
            items: orderItems,
            price: {
                buyerTotalNow: order?.totalPrice - order?.itemsTotal,
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: "SELLER"
        });
    } else {

        if (order?.parcelId) {
            //update the shipment to remove the cancelled items
            await updateOrderShipment({ shipment_id: order?.shippingId, orderItems: order?.items, parcelId: order?.parcelId });
        }

        await prisma.$transaction(async (transactionClient) => {

            //recalculate prices
            await transactionClient.order.update({
                where: {
                    id: order?.id
                },
                data: {
                    totalPrice: order?.totalPrice - refundAmount,
                    sellerTotal: order?.sellerTotal - refundAmount,
                    itemsTotal: order?.itemsTotal - refundAmount,
                    sellerItemsTotal: order?.sellerItemsTotal - refundAmount
                }
            });

            //mark the order items as cancelled
            await transactionClient.orderItem.updateMany({
                where: {
                    id: {
                        in: itemIds
                    }
                },
                data: {
                    isCancelled: true,
                    cancelledAt: new Date(),
                    cancelledBy: "SELLER",
                    cancelReason: cancelReason as CancelReason,
                    cancelReasonDetails: cancelReasonDescription,
                }
            })


            //create cancel evidence group for the order
            await transactionClient.cancelOrderEvidence.createMany({
                data: ids.flatMap(itemId => {
                    return cancelEvidences.map(e => {
                        return {
                            itemId: itemId,
                            key: e?.key,
                            url: e?.url,
                        }
                    })
                })
            })

            //update sell donations
            await transactionClient.sellDonation.updateMany({
                where: {
                    orderItemId: {
                        in: itemIds
                    }
                },
                data: orderItems?.flatMap(item => {
                    return item?.donations?.map(donation => {
                        return {
                            amount: 0,
                            percent: 0,
                            total_amount: donation?.extra_money,
                        }
                    })
                })
            })

        })
    }

    const paymentId = order?.payment?.id;
    const paymentIntentId = order?.payment?.paymentIntentId;

    await RefundQueue.add(jobs.refund, {
        paymentId,
        paymentIntentId,
        reason: "Order item(s) cancelled by seller",
        triggeredBy: "Seller",
        markPaymentRefunded: false,
        amount: refundAmount
    });

    return;

}

const markAsCompletedOrder = async (orderId: string, current_buyerId: string) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            buyerId: true,
            sellerId: true,
            status: true,
            currentShipTo: true,
            items: {
                where: {
                    isCancelled: false
                },
                select: {
                    donations: {
                        select: {
                            amount: true
                        }
                    }
                }
            }
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.buyerId !== current_buyerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the buyer of this order");
    }

    if (order?.status !== "DELIVERED" || order?.currentShipTo !== "BUYER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to mark as completed the order");
    }

    //mark order as completed
    await prisma.order.update({
        where: {
            id: orderId
        },
        data: {
            status: "COMPLETED",
            completedAt: new Date()
        }
    })

    // generate badge for buyer, 1st purchase badge
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "FIRST_PURCHASE", userId: order?.buyerId, increment: order?.items?.length });
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TOP_BUYER", userId: order?.buyerId, increment: order?.items?.length });

    // generate badge for seller, sale badge
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "FIRST_SALE", userId: order?.sellerId, increment: order?.items?.length });
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "FREQUENT_SELLER", userId: order?.sellerId, increment: order?.items?.length });

    const sellerDonationTotal = order?.items?.reduce((acc, item) => {
        const donationAmount = item?.donations?.reduce((donationAcc, donation) => {
            return donationAcc + (donation?.amount || 0);
        }, 0);
        return acc + donationAmount;
    }, 0);

    //get charity supporter badge for seller from sell donations
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "CHARITY_SUPPORTER", userId: order?.sellerId, increment: Math.ceil(sellerDonationTotal) });

    //generate eco seller
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TOP_ECO_SELLER", userId: order?.sellerId, increment: order?.items?.length });

    //charity champion badge
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "CHARITY_CHAMPION", userId: order?.sellerId, increment: Math.ceil(sellerDonationTotal) });

    //top charity fundraiser badge
    BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TOP_CHARITY_FUNDRAISER", userId: order?.sellerId, increment: Math.ceil(sellerDonationTotal) });

}

export const orderService = {
    addNewOrder,
    addNewOfferOrder,
    ordersAsASeller,
    ordersAsABuyer,
    cancelOrderItemBySeller,
    requestCancelOrderItem,
    approveCancelOrderItemBySeller,
    declineCancelOrderItemBySeller,
    confirmOrderReceived,
    getShipingLebel,
    markShippedOrder,
    markAsCompletedOrder,
}