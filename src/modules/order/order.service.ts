import { CancelledBy, CurrentShipTo, OrderAuthStatus, PaymentStatus, Role } from "../../../generated/prisma/browser";
import { CancelReason, OrderAuthResult, OrderItem, OrderStatus, Prisma, Product, ProductCharity, ProductPicture, SellDonation, User } from "../../../generated/prisma/client";
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
import { notificationQueue } from "../../queues/notificaion.queue";
import { productService } from "../product/product.service";
import { Request } from "express";
import { userService } from "../user/user.service";

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
                            assistentSellId: true,
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

    let authAddress: string | null = null;

    //authentication center address is required to place order if authentication is allowed
    if (payload?.allowedAuthentication) {
        const admin = await prisma.user.findFirst({
            where: {
                auth: {
                    role: "ADMIN"
                }
            },
            include: {
                sellerAddress: true
            }
        });

        if (!admin || !admin?.sellerAddress) {
            throw new AppError(httpStatus.NOT_FOUND, "Unable to place order, authentication center address is not available");
        }
        authAddress = admin?.sellerAddress?.id;
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


    const serviceFeeCost = 2.30; // fixed service fee cost
    const authenTicationRate = 15; // fixed authentication cost per item
    const treeGiftRate = 4; // fixed tree gift cost per item


    const orderItems = cartgroup.items.map((item) => {
        const p = item?.product;
        const donation_percent = p.donation_percent || 0;
        const extra_donation = item.extraDonation || 0;

        const unit_price = p?.finalPrice;
        const allocateUnitPrice = p?.finalPrice - (p?.finalPrice * (bundleDiscountPercent / 100));

        const quantity = item.quantity || 1;

        const assisted_sell_commision = item?.product?.assistentSellId ? (allocateUnitPrice * 0.3) : 0; // 30% commission for assisted sell products

        const sellerGrossShareUnit = allocateUnitPrice - assisted_sell_commision;

        const donation_amount = (sellerGrossShareUnit * (donation_percent / 100));

        const sellerUnitPrice = sellerGrossShareUnit - donation_amount;

        const unitAuthFee = payload?.allowedAuthentication ? authenTicationRate : 0; // fixed authentication cost per item

        return {
            product: p,
            productId: p.id,
            sellerId: p.userId,
            unitPrice: unit_price,
            assisted_sell_commision,
            unitAllocatedPrice: allocateUnitPrice,
            sellerFinalUnitPrice: sellerUnitPrice,
            unitAuthFee,
            totalPrice: allocateUnitPrice + extra_donation,
            quantity,
            extra_donation,
            donation_percent, // how much percent of the product price will be donated to charity from seller
            donation_amount, // how much amount of the product price will be donated to charity from seller
            charities: item?.charities ?? [],
        };
    });

    const totalAuthenticationCost = orderItems.reduce((acc, item) => acc + item.unitAuthFee, 0);

    const treeGiftCost = payload?.treeGiftCount * treeGiftRate; // fixed tree gift cost per item

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.unitAllocatedPrice, 0);
    const otherTotal = serviceFeeCost + treeGiftCost + totalAuthenticationCost;

    const totalExtraDonation = cartgroup.items.reduce((acc, item) => acc + (item.extraDonation || 0), 0);

    const sellerTotal = orderItems.reduce((acc, item) => acc + item?.sellerFinalUnitPrice, 0);

    const totalAssitedSellCommission = orderItems.reduce((acc, item) => acc + item?.assisted_sell_commision, 0);

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": sellerDetails?.full_name,
            "contact_phone": sellerDetails?.contact,
            "contact_email": sellerDetails?.email
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
                        "declared_customs_value": item?.unitPrice || 0,
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

        const shipment = await transactionClient.shipment.create({
            data: {
                courier_service_id: payload?.shipmentServiceId,
                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                deliveryCharge: shippingRate,
                originId: sellerDetails?.id,
                destinationId: (payload?.allowedAuthentication && authAddress) ? authAddress : billing_details?.id,
                userId: userId,
            }
        });

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

                assistedSellCommission: totalAssitedSellCommission,

                authenticationFee: totalAuthenticationCost,

                allowedAuthentication: payload?.allowedAuthentication,

                extraDonation: totalExtraDonation,

                serviceFee: serviceFeeCost,

                originDetailsId: sellerDetails?.id,

                pricingSource: "BUNDLE",

                shipmentId: shipment?.id,

                currentShipTo: payload?.allowedAuthentication ? "AUTHENTICATION_CENTER" : "BUYER",

                totalDelivery: shippingRate,
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, assisted_sell_commision, unitAuthFee, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            parcelItemId,
                            assistedSellCommission: assisted_sell_commision,
                            unitAuthFee,
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
                images: p.images.map((image) => encodeURI(image?.url)),
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
                            assistentSellId: true,
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

    let authAddress: string | null = null;

    const serviceFeeCost = 2.30; // fixed service fee cost
    const authenTicationRate = 15; // fixed authentication cost per item
    const treeGiftRate = 4; // fixed tree gift cost per item

    //authentication center address is required to place order if authentication is allowed
    if (payload?.allowedAuthentication) {
        const admin = await prisma.user.findFirst({
            where: {
                auth: {
                    role: "ADMIN"
                }
            },
            include: {
                sellerAddress: true
            }
        });

        if (!admin || !admin?.sellerAddress) {
            throw new AppError(httpStatus.NOT_FOUND, "Unable to place order, authentication center address is not available");
        }
        authAddress = admin?.sellerAddress?.id;
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

        const quantity = item.quantity || 1;

        const assisted_sell_commision = item?.product?.assistentSellId ? (allocateUnitPrice * 0.3) : 0; // 30% commission for assisted sell products

        const sellerGrossShareUnit = allocateUnitPrice - assisted_sell_commision;

        const donation_amount = (sellerGrossShareUnit * (donation_percent / 100));

        const sellerUnitPrice = sellerGrossShareUnit - donation_amount;

        const unitAuthFee = payload?.allowedAuthentication ? authenTicationRate : 0; // fixed authentication cost per item

        return {
            product: p,
            productId: p.id,
            sellerId: p.userId,
            unitPrice: unit_price,
            assisted_sell_commision,
            unitAllocatedPrice: allocateUnitPrice,
            sellerFinalUnitPrice: sellerUnitPrice,
            totalPrice: allocateUnitPrice + extra_donation,
            quantity,
            extra_donation,
            donation_percent, // how much percent of the product price will be donated to charity from seller
            donation_amount, // how much amount of the product price will be donated to charity from seller
            unitAuthFee,
            charities: p?.charities,
        };
    });

    const totalAuthenticationCost = orderItems.reduce((acc, item) => acc + item.unitAuthFee, 0);

    const treeGiftCost = payload?.treeGiftCount * treeGiftRate; // fixed tree gift cost per item

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.unitAllocatedPrice, 0);
    const otherTotal = serviceFeeCost + treeGiftCost + totalAuthenticationCost;

    const totalExtraDonation = 0;

    const sellerTotal = orderItems.reduce((acc, item) => acc + item?.sellerFinalUnitPrice, 0);

    const totalAssitedSellCommission = orderItems.reduce((acc, item) => acc + item?.assisted_sell_commision, 0);

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": sellerDetails?.full_name,
            "contact_phone": sellerDetails?.contact,
            "contact_email": sellerDetails?.email
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
                        "declared_customs_value": item?.unitPrice || 0,
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

        const shipment = await transactionClient.shipment.create({
            data: {
                courier_service_id: payload?.shipmentServiceId,
                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                deliveryCharge: shippingRate,
                originId: sellerDetails?.id,
                destinationId: (payload?.allowedAuthentication && authAddress) ? authAddress : billing_details?.id,
                userId: userId,
            }
        });

        //create new order for this cart group
        const order = await transactionClient.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                totalPrice: total,
                itemsTotal: discountedItemTotal,
                treeCredit: treeCredit ?? 0,
                buyerId: userId,
                assistedSellCommission: totalAssitedSellCommission,
                billingId: billing_details?.id,
                sellerId: orderItems[0]?.sellerId,
                sellerItemsTotal: offer?.offeredPrice,
                sellerTotal,
                bundleDiscountPercent: 0,
                authenticationFee: totalAuthenticationCost,
                serviceFee: serviceFeeCost,

                allowedAuthentication: payload?.allowedAuthentication,

                extraDonation: totalExtraDonation,

                originDetailsId: sellerDetails?.id,
                pricingSource: "OFFER",

                currentShipTo: payload?.allowedAuthentication ? "AUTHENTICATION_CENTER" : "BUYER",

                shipmentId: shipment?.id,

                totalDelivery: shippingRate,
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, assisted_sell_commision, unitAuthFee, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            sell_donation: donation_amount,
                            assistedSellCommission: assisted_sell_commision,
                            unitAuthFee,
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
                images: p.images.map((image) => encodeURI(image?.url)),
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

type ProductWithCharities = Product & {
    charities: ProductCharity[];
    images: ProductPicture[];
};

const addNewSingleOrder = async (payload: {
    productId: string,
    shipmentServiceId: string,
    allowedAuthentication: boolean,
    treeGiftCount: number
}, user: { userId: string, email: string }, req: Request) => {

    const { productId, shipmentServiceId, allowedAuthentication, treeGiftCount } = payload;

    const { userId, email } = user;

    //check product is available and not deleted
    const product = await productService.productDetails(productId, req, userId) as ProductWithCharities;

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist")
    }
    if (product.isDeleted) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist")
    }

    if (product.stock < 1) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product is out of stock")
    }

    const userAddress = await userService.addressesByUser(userId);
    const billing_details = userAddress?.buyingAddress;

    if (!billing_details) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipping address is required")
    }

    const sellerAddress = await userService.addressesByUser(product.userId);
    const sellerDetails = sellerAddress?.sellingAddress;

    if (!sellerDetails) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller address is required")
    }

    let authAddress: string | null = null;

    //authentication center address is required to place order if authentication is allowed
    if (allowedAuthentication) {
        const admin = await prisma.user.findFirst({
            where: {
                auth: {
                    role: "ADMIN"
                }
            },
            include: {
                sellerAddress: true
            }
        });

        if (!admin || !admin?.sellerAddress) {
            throw new AppError(httpStatus.NOT_FOUND, "Unable to place order, authentication center address is not available");
        }
        authAddress = admin?.sellerAddress?.id;
    }

    const serviceFeeCost = 2.30; // fixed service fee cost
    const authenTicationRate = 15; // fixed authentication cost per item
    const treeGiftRate = 4; // fixed tree gift cost per item

    const orderItems = [{
        product,
        quantity: 1,
        extraDonation: 0,
        charities: product?.charities,
    }].map((item) => {
        const p = item?.product;
        const donation_percent = p.donation_percent || 0;
        const extra_donation = item.extraDonation || 0;

        const unit_price = p?.finalPrice;
        const allocateUnitPrice = p?.finalPrice;

        const quantity = item.quantity || 1;

        const assisted_sell_commision = item?.product?.assistentSellId ? (allocateUnitPrice * 0.3) : 0; // 30% commission for assisted sell products

        const sellerGrossShareUnit = allocateUnitPrice - assisted_sell_commision;

        const donation_amount = (sellerGrossShareUnit * (donation_percent / 100));

        const sellerUnitPrice = sellerGrossShareUnit - donation_amount;

        const unitAuthFee = allowedAuthentication ? authenTicationRate : 0; // fixed authentication cost per item

        return {
            product: p,
            productId: p.id,
            sellerId: p.userId,
            unitPrice: unit_price,
            assisted_sell_commision,
            unitAllocatedPrice: allocateUnitPrice,
            sellerFinalUnitPrice: sellerUnitPrice,
            unitAuthFee,
            totalPrice: allocateUnitPrice + extra_donation,
            quantity,
            extra_donation,
            donation_percent, // how much percent of the product price will be donated to charity from seller
            donation_amount, // how much amount of the product price will be donated to charity from seller
            charities: item?.charities ?? [],
        };
    });

    const totalAuthenticationCost = orderItems.reduce((acc, item) => acc + item.unitAuthFee, 0);

    const treeGiftCost = payload?.treeGiftCount * treeGiftRate; // fixed tree gift cost per item

    const discountedItemTotal = orderItems.reduce((acc, item) => acc + item.unitAllocatedPrice, 0);
    const otherTotal = serviceFeeCost + treeGiftCost + totalAuthenticationCost;

    const totalExtraDonation = 0;

    const sellerTotal = orderItems.reduce((acc, item) => acc + item?.sellerFinalUnitPrice, 0);

    const totalAssitedSellCommission = orderItems.reduce((acc, item) => acc + item?.assisted_sell_commision, 0);

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": sellerDetails?.full_name,
            "contact_phone": sellerDetails?.contact,
            "contact_email": sellerDetails?.email
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
                        "declared_customs_value": item?.unitPrice || 0,
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

        const shipment = await transactionClient.shipment.create({
            data: {
                courier_service_id: shipmentServiceId,
                shippingId: shipmentData?.shipment?.easyship_shipment_id,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                deliveryCharge: shippingRate,
                originId: sellerDetails?.id,
                destinationId: (allowedAuthentication && authAddress) ? authAddress : billing_details?.id,
                userId: userId,
            }
        });

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
                bundleDiscountPercent: 0,

                assistedSellCommission: totalAssitedSellCommission,

                authenticationFee: totalAuthenticationCost,

                allowedAuthentication: payload?.allowedAuthentication,

                extraDonation: totalExtraDonation,

                serviceFee: serviceFeeCost,

                originDetailsId: sellerDetails?.id,

                pricingSource: "BUNDLE",

                shipmentId: shipment?.id,

                currentShipTo: payload?.allowedAuthentication ? "AUTHENTICATION_CENTER" : "BUYER",

                totalDelivery: shippingRate,
                items: {
                    create: orderItems.map(({ charities, sellerId, donation_amount, donation_percent, product, assisted_sell_commision, unitAuthFee, ...item }) => {
                        const charityCount = charities.length;
                        const splitAmount = charityCount > 0 ? (donation_amount / charityCount) : 0;
                        const splitExtra = charityCount > 0 ? (item.extra_donation / charityCount) : 0;

                        const dbProduct = product;

                        const splitPercent = charityCount > 0 ? 100 / charityCount : 0;

                        const parcelItemId = shipmentItems.find(parcelItem => parcelItem?.description === product?.title && parcelItem?.declared_customs_value === product?.finalPrice)?.id;

                        return {
                            ...item,
                            parcelItemId,
                            assistedSellCommission: assisted_sell_commision,
                            unitAuthFee,
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

        return createdPayment;

    });

    const total_extra_donation = 0;

    const checkOutSessionItems = [
        ...orderItems.map((item) => {
            const p = item?.product;
            return {
                amount: item?.unitAllocatedPrice,
                images: p.images.map((image) => encodeURI(image?.url)),
                name: p?.title,
                quantity: 1,
            };
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
        user: { userId, email } as unknown as User,
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
    const isDirectToBuyer = !order?.allowedAuthentication

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
                    payment: true,
                    shipment: true
                }
            },
            donations: true,
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
    const isDirectToBuyer = !order?.allowedAuthentication

    const isAuthRound = order.currentShipTo === CurrentShipTo.AUTHENTICATION_CENTER;

    const canCancel = order.status === OrderStatus.PENDING && (isDirectToBuyer || isAuthRound);

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
    if (availableItems.length === 0 && order?.shipment?.isLebelGenerated) {
        await cancelFullOrderShipment({
            shipment_id: order?.shipment?.shippingId,
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
            shipment_id: order?.shipment?.shippingId,
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


        if (order?.shipment?.parcelId) {
            //update the shipment to remove the cancelled items
            await updateOrderShipment({ shipment_id: order?.shipment?.shippingId, orderItems: availableItems, parcelId: order?.shipment?.parcelId });
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
            shipment: true,
            items: {
                select: {
                    isCancelled: true,
                    id: true
                }
            },
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "BUYER") {
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

const orders = async (query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.OrderWhereInput[] = [];
    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status, paymentStatus, currentShipTo } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    id: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    }
                },
                {
                    orderNumber: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                userName: {
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
                    seller: {
                        OR: [
                            {
                                userName: {
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
                    originDetails: {
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
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as OrderStatus
        })
    }

    if (paymentStatus) {
        AndConditions.push({
            payment: {
                status: paymentStatus as PaymentStatus
            }
        })
    }

    if (currentShipTo) {
        AndConditions.push({
            currentShipTo: currentShipTo as CurrentShipTo
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
                    cancelEvidences: true,
                    donations: {
                        include: {
                            charity: {
                                select: {
                                    userName: true,
                                    picture: true
                                }
                            }
                        }
                    }
                }
            },
            payment: true,
            buyer: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            seller: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            shipment: true,
            authShipment: true,
            originDetails: true,
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

const ordersAsASeller = async (sellerId: string, query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.OrderWhereInput[] = [{
        sellerId, payment: {
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
                    }
                },
                {
                    orderNumber: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                userName: {
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
                    seller: {
                        OR: [
                            {
                                userName: {
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
                    originDetails: {
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
                    cancelEvidences: true,
                    donations: {
                        include: {
                            charity: {
                                select: {
                                    userName: true,
                                    picture: true
                                }
                            }
                        }
                    }
                }
            },
            payment: true,
            buyer: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            shipment: true,
            authShipment: true,
            originDetails: true,
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
        buyerId, payment: {
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
                    }
                },
                {
                    orderNumber: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                userName: {
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
                    seller: {
                        OR: [
                            {
                                userName: {
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
                    originDetails: {
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
                    cancelEvidences: true,
                    donations: {
                        include: {
                            charity: {
                                select: {
                                    userName: true,
                                    picture: true
                                }
                            }
                        }
                    }
                }
            },
            seller: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            payment: true,
            originDetails: true,
            billingDetails: true,
            shipment: true,
            authShipment: true,
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

const authenticationOrders = async (query: Record<string, unknown>, options: TPaginationOptions) => {

    const AndConditions: Prisma.OrderWhereInput[] = [{
        allowedAuthentication: true,
        payment: {
            status: {
                in: ["SUCCESSED", "REFUNDED"]
            }
        }
    }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, status, paymentStatus, authStatus, dateFrom, dateTo, currentShipTo } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    id: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    }
                },
                {
                    orderNumber: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    buyer: {
                        OR: [
                            {
                                userName: {
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
                    seller: {
                        OR: [
                            {
                                userName: {
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
                    originDetails: {
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
            ],
        });
    }

    if (status) {
        AndConditions.push({
            status: status as OrderStatus
        })
    }

    if (paymentStatus) {
        AndConditions.push({
            payment: {
                status: paymentStatus as PaymentStatus
            }
        })
    }

    if (authStatus) {
        AndConditions.push({
            authStatus: authStatus as OrderAuthStatus
        })
    }

    if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom as string);
        const toDate = new Date(dateTo as string);

        AndConditions.push({
            createdAt: {
                gte: fromDate,
                lte: toDate
            }
        })
    }

    if (currentShipTo) {
        AndConditions.push({
            currentShipTo: currentShipTo as CurrentShipTo
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
                            id: true,
                            images: {
                                take: 1,
                                orderBy: {
                                    order: "asc"
                                },
                                select: {
                                    id: true,
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
                }
            },
            payment: {
                select: {
                    status: true,
                    stripe_status: true,
                    id: true,
                    paid_amount: true,
                }
            },
            buyer: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            seller: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            originDetails: true,
            billingDetails: true,
            shipment: true,
            authShipment: true,
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

const createLebelForOrder = async ({ shipment_id, dbShipmentId }: { dbShipmentId: string, shipment_id: string }) => {

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

    await prisma.shipment.update({
        where: {
            id: dbShipmentId
        },
        data: {
            lebelUrl: labelDoc?.url,
            isLebelGenerated: true
        }
    })

    return labelDoc?.url || null;
}

const getShipingLebel = async (orderId: string, current_sellerId: string) => {
    const order = await prisma.order.findFirst({ where: { id: orderId }, include: { shipment: true } });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.status == "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is cancelled, unable to generate label")
    }

    if (order?.sellerId !== current_sellerId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }

    if (order?.shipment?.lebelUrl) {
        return order?.shipment?.lebelUrl;
    }

    else if (order?.shipment?.isLebelGenerated) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label already generated but not available, please contact support")
    }

    const labelUrl = await createLebelForOrder({ shipment_id: order?.shipment?.shippingId, dbShipmentId: order?.shipment?.id });

    if (!labelUrl) {
        throw new AppError(httpStatus.BAD_REQUEST, "Label generated but not available, please contact support")
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
                authenticationFee: 0,
                assistedSellCommission: 0,
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
                unitAuthFee: 0,
                sell_donation: 0,
                assistedSellCommission: 0,
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

        const sellDonations = items?.flatMap(item =>
            item?.donations?.map(donation => ({
                id: donation.id,
                amount: 0,
                percent: 0,
                total_amount: donation.extra_money,
            })) ?? []
        );

        // Update sell donations
        for (const donation of sellDonations) {
            await transactionClient.sellDonation.update({
                where: {
                    id: donation.id,
                },
                data: {
                    amount: donation.amount,
                    percent: donation.percent,
                    total_amount: donation.total_amount,
                },
            });
        }


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
                authenticationFee: 0,
                assistedSellCommission: 0,
                sellerTotal: price?.sellerTotalNow,

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
                assistedSellCommission: 0,
                cancelledAt: new Date(),
                unitAuthFee: 0,
                sell_donation: 0,
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

        const sellDonations = items?.flatMap(item =>
            item?.donations?.map(donation => ({
                id: donation.id,
                amount: 0,
                percent: 0,
                total_amount: donation.extra_money,
            })) ?? []
        );

        // Update sell donations
        for (const donation of sellDonations) {
            await transactionClient.sellDonation.update({
                where: {
                    id: donation.id,
                },
                data: {
                    amount: donation.amount,
                    percent: donation.percent,
                    total_amount: donation.total_amount,
                },
            });
        }

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

const cancelOrderItemBySeller = async (payload: { orderId: string, itemIds: string[], cancelReason: string, cancelReasonDescription: string, cancelEvidences: { key: string, url: string }[] }, cUser: { id: string, userName: string, role: string }) => {

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
            shipment: true,
            payment: true,
        }
    })

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist")
    }

    if (order?.sellerId !== cUser?.id && cUser?.role !== Role.ADMIN) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the seller of this order")
    }
    if (order?.status === "CANCELLED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order is already cancelled")
    }

    //check allow to cancel
    const isDirectToBuyer = !order?.allowedAuthentication;

    const isAuthRound = order.currentShipTo === CurrentShipTo.AUTHENTICATION_CENTER;

    const canCancel = order.status === OrderStatus.PENDING && (isDirectToBuyer || isAuthRound);

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

    const refundAmount = orderItems.reduce((acc, item) => acc + (item?.unitAllocatedPrice || 0), 0);
    const authenticationFee = orderItems.reduce((acc, item) => acc + (item?.unitAuthFee || 0), 0);
    const assitedSellCommision = orderItems.reduce((acc, item) => acc + (item?.assistedSellCommission || 0), 0);

    const sellerRefundItemsTotal = orderItems.reduce((acc, item) => acc + (item?.sellerFinalUnitPrice || 0), 0)

    if (!order?.payment || !order?.payment?.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment not found for this order, contact support")
    }

    if (allowCancelFullOrder && order?.shipment?.isLebelGenerated) {
        await cancelFullOrderShipment({
            shipment_id: order?.shipment?.shippingId,
            orderId: order?.id,
            cancelReason,
            cancelReasonDescription,
            cancelEvidences,
            items: orderItems,
            price: {
                buyerTotalNow: order?.totalPrice - (order?.itemsTotal + authenticationFee),
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: "SELLER"
        });
    } else if (allowCancelFullOrder) {
        await dltOrderShipment({
            shipment_id: order?.shipment?.shippingId,
            orderId: order?.id,
            cancelReason,
            cancelReasonDescription,
            cancelEvidences,
            items: orderItems,
            price: {
                buyerTotalNow: order?.totalPrice - (order?.itemsTotal + authenticationFee),
                sellerTotalNow: order?.sellerTotal - order?.sellerItemsTotal
            },
            cancelledBy: "SELLER"
        });
    } else {

        if (order?.shipment?.parcelId) {
            //update the shipment to remove the cancelled items
            await updateOrderShipment({ shipment_id: order?.shipment?.shippingId, orderItems: order?.items, parcelId: order?.shipment?.parcelId });
        }

        await prisma.$transaction(async (transactionClient) => {

            //recalculate prices
            await transactionClient.order.update({
                where: {
                    id: order?.id
                },
                data: {
                    authenticationFee: order?.authenticationFee - authenticationFee,
                    totalPrice: order?.totalPrice - refundAmount,
                    sellerTotal: order?.sellerTotal - sellerRefundItemsTotal,
                    itemsTotal: order?.itemsTotal - refundAmount,
                    sellerItemsTotal: order?.sellerItemsTotal - sellerRefundItemsTotal,
                    assistedSellCommission: order?.assistedSellCommission - assitedSellCommision
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
                    unitAuthFee: 0,
                    sell_donation: 0,
                    assistedSellCommission: 0,
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

            const sellDonations = orderItems?.flatMap(item =>
                item?.donations?.map(donation => ({
                    id: donation.id,
                    amount: 0,
                    percent: 0,
                    total_amount: donation.extra_money,
                })) ?? []
            );

            // Update sell donations
            for (const donation of sellDonations) {
                await transactionClient.sellDonation.update({
                    where: {
                        id: donation.id,
                    },
                    data: {
                        amount: donation.amount,
                        percent: donation.percent,
                        total_amount: donation.total_amount,
                    },
                });
            }

        })
    }

    const paymentId = order?.payment?.id;
    const paymentIntentId = order?.payment?.paymentIntentId;

    await RefundQueue.add(jobs.refund, {
        paymentId,
        paymentIntentId,
        reason: "Order item(s) cancelled by seller",
        triggeredBy: "Seller",
        markPaymentRefunded: allowCancelFullOrder ? true : false,
        amount: refundAmount + authenticationFee
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
            },
            shipment: {
                select: {
                    id: true,
                    status: true
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

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "BUYER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to mark as completed the order");
    }

    await prisma.$transaction(async (transactionClient) => {

        //mark order as completed
        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                status: "COMPLETED",
                completedAt: new Date()
            }
        })

        //generate event
        await transactionClient.shipmentEvent.create({
            data: {
                eventType: "ORDER_COMPLETED",
                shipmentStatus: "DELIVERED",
                eventTime: new Date(),
                eventDescription: "Congratulations! Your order has been marked as completed.",
                shipmentId: order?.shipment?.id,
            }
        });
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

const markOrderReceivedFromAuthCenter = async (orderId: string) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            status: true,
            currentShipTo: true,
            orderNumber: true,
            sellerId: true,
            seller: {
                select: {
                    fcmToken: true,
                }
            },
            buyerId: true,
            buyer: {
                select: {
                    fcmToken: true,
                }
            },
            items: {
                where: {
                    isCancelled: false
                },
                select: {
                    product: {
                        select: {
                            images: {
                                take: 1,
                                orderBy: {
                                    order: "asc"
                                },
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            shipment: {
                select: {
                    id: true,
                    status: true
                }
            }
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "AUTHENTICATION_CENTER") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to mark as received the order");
    }

    // Mark the order as received from the authentication center
    await prisma.$transaction(async (transactionClient) => {
        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                authStatus: "ITEM_RECEIVED",
            }
        });

        //generate event
        await transactionClient.shipmentEvent.create({
            data: {
                eventType: "ORDER_AUTH_STATUS_CHANGED",
                shipmentStatus: "DELIVERED",
                eventTime: new Date(),
                eventDescription: "Authentication center has marked the order as received for verification",
                shipmentId: order?.shipment?.id,
            }
        });
    })

    // Notify the buyer
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Authentication Center Marked Received Order",
            message: `Authentication center has marked your placed **${order?.orderNumber}** order as **Received** for verification. `,
            actorId: order?.buyerId,
            receiverId: order?.buyerId,
            fcmToken: order?.buyer?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });

    // Notify the seller
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Authentication Center Marked Received Order",
            message: `Authentication center has marked your sold **${order?.orderNumber}** order as **Received** for verification. `,
            actorId: order?.sellerId,
            receiverId: order?.sellerId,
            fcmToken: order?.seller?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });
}

const markOrderAuthInProgress = async (orderId: string) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            status: true,
            currentShipTo: true,
            orderNumber: true,
            sellerId: true,
            authStatus: true,
            seller: {
                select: {
                    fcmToken: true,
                }
            },
            buyerId: true,
            buyer: {
                select: {
                    fcmToken: true,
                }
            },
            items: {
                where: {
                    isCancelled: false
                },
                select: {
                    product: {
                        select: {
                            images: {
                                take: 1,
                                orderBy: {
                                    order: "asc"
                                },
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            shipment: {
                select: {
                    id: true,
                    status: true
                }
            }
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "AUTHENTICATION_CENTER" || order?.authStatus !== "ITEM_RECEIVED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to mark as in progress authentication for the order");
    }

    await prisma.$transaction(async (transactionClient) => {

        // Mark the order as received from the authentication center
        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                authStatus: "IN_PROGRESS",
            }
        });

        //generate event
        await transactionClient.shipmentEvent.create({
            data: {
                eventType: "ORDER_AUTH_STATUS_CHANGED",
                shipmentStatus: "DELIVERED",
                eventTime: new Date(),
                eventDescription: "Authentication center has marked the order verification as in progress",
                shipmentId: order?.shipment?.id,
            }
        });
    })



    // Notify the buyer
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Order Authentication In Progress",
            message: `Authentication center has marked your placed **${order?.orderNumber}** order verification as **In Progress**. `,
            actorId: order?.buyerId,
            receiverId: order?.buyerId,
            fcmToken: order?.buyer?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });

    // Notify the seller
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Authentication Center Marked Received Order",
            message: `Authentication center has marked your sold **${order?.orderNumber}** order verification as **In Progress**. `,
            actorId: order?.sellerId,
            receiverId: order?.sellerId,
            fcmToken: order?.seller?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });
}

const addAuthResultToOrder = async (payload: { orderId: string; items: { itemId: string; result: OrderAuthResult }[] }) => {
    const { orderId, items } = payload;

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            status: true,
            currentShipTo: true,
            orderNumber: true,
            sellerId: true,
            authStatus: true,
            seller: {
                select: {
                    fcmToken: true,
                }
            },
            buyerId: true,
            buyer: {
                select: {
                    fcmToken: true,
                }
            },
            items: {
                where: {
                    isCancelled: false
                },
                select: {
                    id: true,
                    unitAllocatedPrice: true,
                    product: {
                        select: {
                            images: {
                                take: 1,
                                orderBy: {
                                    order: "asc"
                                },
                                select: {
                                    url: true
                                }
                            }
                        }
                    }
                }
            },
            payment: {
                select: {
                    paymentIntentId: true,
                    id: true,
                }
            },
            shipment: {
                select: {
                    id: true,
                    status: true
                }
            }
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "AUTHENTICATION_CENTER" || order?.authStatus !== "IN_PROGRESS") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to add authentication result for the order");
    }

    if (!order?.payment || !order?.payment?.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment not found for this order, contact support")
    }

    for (const item of items) {
        const orderItem = order.items.find(i => i.id === item.itemId);
        if (!orderItem) {
            throw new AppError(httpStatus.NOT_FOUND, "Order item does not exist or is cancelled");
        }
    }

    await prisma.$transaction(async (transactionClient) => {

        for (const item of items) {
            await transactionClient.orderItem.update({
                where: {
                    id: item.itemId
                },
                data: {
                    authResult: item.result
                }
            });
        }

        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                authStatus: "RESPONDED"
            }
        });

        //generate event
        await transactionClient.shipmentEvent.create({
            data: {
                eventType: "ORDER_AUTH_STATUS_CHANGED",
                shipmentStatus: "DELIVERED",
                eventTime: new Date(),
                eventDescription: "Your order verification has been completed by the authentication center.",
                shipmentId: order?.shipment?.id,
            }
        });

    });

    // Notify the buyer
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Order Authentication Result Available",
            message: `Authentication completed for your placed **${order?.orderNumber}** order. Please check the order details for the authentication result.`,
            actorId: order?.buyerId,
            receiverId: order?.buyerId,
            fcmToken: order?.buyer?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });

    // Notify the seller
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
            title: "Order Authentication Result Available",
            message: `Authentication completed for sold **${order?.orderNumber}** order. Please check the order details for the authentication result.`,
            actorId: order?.sellerId,
            receiverId: order?.sellerId,
            fcmToken: order?.seller?.fcmToken,
            entityImgs: order?.items?.map(item => item?.product?.images?.[0]?.url).filter(Boolean) || [],
            entityId: orderId,
            entityType: "ORDER",
            type: "ORDER_AUTH_STATUS_CHANGED",
            groupKeyId: null,
        }
    });

    const failedItems = order.items.filter(item => {
        const resultItem = items.find(i => i.itemId === item.id);
        return resultItem?.result === "FAILED";
    });

    const refundAmount = failedItems.reduce((acc, item) => acc + (item?.unitAllocatedPrice || 0), 0);

    if (refundAmount > 0) {
        await RefundQueue.add(jobs.refund, {
            paymentId: order?.payment?.id,
            paymentIntentId: order?.payment?.paymentIntentId,
            reason: "Order item(s) failed authentication",
            triggeredBy: "Authentication Center",
            markPaymentRefunded: false,
            amount: refundAmount
        });
    }


};

const generateOrderAuthShipment = async (adminId: string, orderId: string) => {

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            status: true,
            currentShipTo: true,
            orderNumber: true,
            sellerId: true,
            authStatus: true,
            seller: {
                select: {
                    fcmToken: true,
                }
            },
            buyerId: true,
            buyer: {
                select: {
                    fcmToken: true,
                }
            },
            items: {
                where: {
                    isCancelled: false,
                    authResult: "PASSED"
                },
                select: {
                    id: true,
                    unitPrice: true,
                    product: {
                        select: {
                            title: true,
                            hight_cm: true,
                            width_cm: true,
                            length_cm: true,
                            weight_kg: true,
                        }
                    }
                }
            },
            billingDetails: true,
            shipment: {
                select: {
                    status: true,
                    courier_service_id: true,
                }
            },
            authShipment: {
                select: {
                    status: true,
                }
            },
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.shipment?.status !== "DELIVERED" || order?.currentShipTo !== "AUTHENTICATION_CENTER" || order?.authStatus !== "RESPONDED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Unable to generate shipment for the order");
    }

    if (order?.items?.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No items available for the shipment, all items are either cancelled or failed authentication.");
    }

    const billing_details = order?.billingDetails;

    if (!billing_details) {
        throw new AppError(httpStatus.BAD_REQUEST, "Shipping address not available for the create a shipment.");
    }

    const authCenterlocation = await prisma.billingDetails.findFirst({ where: { sellerId: adminId } });

    const sellerDetails = authCenterlocation;

    if (!sellerDetails) {
        throw new AppError(httpStatus.BAD_REQUEST, "Authentication center address not available for the create a shipment.");
    }

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(sellerDetails?.address1),
            "line_2": truncate(sellerDetails?.address2),
            "city": truncate(sellerDetails?.city, 20),
            "state": truncate(sellerDetails?.state, 20),
            "postal_code": truncate(sellerDetails?.zip_code, 10),
            "country_alpha2": sellerDetails?.countryCode,
            "company_name": "FASHION",
            "contact_name": sellerDetails?.full_name,
            "contact_phone": sellerDetails?.contact,
            "contact_email": sellerDetails?.email
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
            "courier_service_id": order?.shipment?.courier_service_id
        },
        "shipping_settings": {
            "units": {
                "weight": "kg",
                "dimensions": "cm"
            },
            "output_currency": "USD",
            "buy_label": true,
            "buy_label_synchronous": true,
            "printing_options": {
                "format": "url"
            },
        },
        "parcels": [
            {
                "items": order?.items?.map((item) => {
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
                        "declared_customs_value": item?.unitPrice || 0,
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

    const parcelId = shipmentData?.shipment?.parcels[0]?.id;
    const shippingId = shipmentData?.shipment?.easyship_shipment_id;

    const shippingRate = shipmentData?.shipment?.rates.find(rate => rate?.courier_service?.id === order?.shipment?.courier_service_id)?.total_charge;

    const labelDoc = shipmentData?.shipment?.shipping_documents?.find(doc => doc.category === "label");

    const dbShipment = await prisma.$transaction(async (transactionClient) => {

        const shipment = await transactionClient.shipment.create({
            data: {
                courier_service_id: order?.shipment?.courier_service_id,
                shippingId: shippingId,
                parcelId: parcelId,
                trackingUrl: shipmentData?.shipment?.tracking_page_url,
                isLebelGenerated: labelDoc?.url ? true : false,
                lebelUrl: labelDoc?.url || null,
                deliveryCharge: shippingRate,
                originId: authCenterlocation?.id,
                destinationId: billing_details?.id,
                userId: order?.buyerId,
            }
        });

        await transactionClient.order.update({
            where: {
                id: orderId
            },
            data: {
                authShipmentId: shipment?.id,
            }
        });

        return shipment;

    })

    return { labelUrl: labelDoc?.url || null, shippingId, parcelId, dbShipmentId: dbShipment?.id };

}

const createLebelForAuthShipment = async ({ shipment_id, dbShipmentId }: { dbShipmentId: string, shipment_id: string }) => {

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

        console.log(errorData);

        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Lebel generation failed',
        );
    }

    const data = await rateRes.json() as ILabel;

    const labelDoc = data?.shipment?.shipping_documents?.find(doc => doc.category === "label");

    await prisma.shipment.update({
        where: {
            id: dbShipmentId
        },
        data: {
            lebelUrl: labelDoc?.url,
            isLebelGenerated: true
        }
    })

    if (!labelDoc?.url) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Lebel generation failed, try again later',
        );
    }

    return labelDoc?.url || null;
}

const getAuthShippingLebel = async (adminId: string, orderId: string) => {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
        },
        select: {
            authShipment: {
                select: {
                    id: true,
                    lebelUrl: true,
                    shippingId: true,
                }
            }
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    if (order?.authShipment?.lebelUrl) {
        return order?.authShipment?.lebelUrl;
    }
    //just generate the label for the existing shipment
    else if (order?.authShipment) {
        return await createLebelForAuthShipment({ shipment_id: order?.authShipment?.shippingId, dbShipmentId: order?.authShipment?.id });
    }
    //generate the shipment and label for the order
    else {
        const { labelUrl, shippingId, dbShipmentId } = await generateOrderAuthShipment(adminId, orderId);

        //if label is not generated, then generate the label for the existing shipment
        if (!labelUrl) {
            return await createLebelForAuthShipment({ shipment_id: shippingId, dbShipmentId });
        } else {
            return labelUrl;
        }
    }
}

const orderDetails = async (orderNumber: string) => {

    const haveHashBefore = orderNumber.startsWith("#");

    const orderCode = haveHashBefore ? orderNumber : `#${orderNumber}`;

    const order = await prisma.order.findFirst({
        where: {
            orderNumber: orderCode
        },
        include: {
            items: {
                where: {
                    isCancelled: false
                },
                include: {
                    product: {
                        select: {
                            title: true,
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
                        },
                    },
                }
            },
            seller: {
                select: {
                    userName: true,
                    picture: true,
                }
            },
            payment: true,
            shipment: {
                include: {
                    origin: true,
                    destination: true,
                }
            },
            authShipment: {
                include: {
                    origin: true,
                    destination: true,
                }
            },
        },
    });

    if (!order) {
        return { order: null, events: [] };
    }

    const shipmentIds = [order?.shipmentId]

    if (order?.authShipmentId) {
        shipmentIds.push(order?.authShipmentId)
    }

    const events = await prisma.shipmentEvent.findMany({
        where: {
            shipmentId: {
                in: shipmentIds
            }
        },
        orderBy: {
            eventTime: 'desc'
        }
    });

    return { order, events };
}

const orderStats = async () => {

    const totalOrders = await prisma.order.count();
    const totalSells = await prisma.order.aggregate({
        _sum: {
            itemsTotal: true,
        },
        where: {
            payment: {
                status: 'SUCCESSED'
            }
        }
    });

    const pendingOrders = await prisma.order.count({
        where: {
            status: "PENDING"
        }
    });

    const shippingOrder = await prisma.order.count({
        where: {
            status: "SHIPPING"
        }
    });

    const completedOrder = await prisma.order.count({
        where: {
            status: "COMPLETED"
        }
    });

    const cancelledOrder = await prisma.order.count({
        where: {
            status: "CANCELLED"
        }
    });

    return {
        totalOrders,
        totalSells: totalSells?._sum?.itemsTotal || 0,
        pendingOrders,
        shippingOrder,
        completedOrder,
        cancelledOrder
    };

}

export const orderService = {
    orders,
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
    markAsCompletedOrder,
    authenticationOrders,
    markOrderReceivedFromAuthCenter,
    addAuthResultToOrder,
    markOrderAuthInProgress,
    getAuthShippingLebel,
    orderDetails,

    addNewSingleOrder,

    orderStats
}