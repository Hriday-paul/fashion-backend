import config from "../../config";
import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";
import crypto from "crypto";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import { BillingDetails, CartGroup, Offer, Prisma, Size, User } from "../../../generated/prisma/client";
import { offerService } from "../offer/offer.service";

const cartsByUser = async (userId: string) => {

    //check on redis cache first
    const cacheKey = await redisKeys.userCartKey({ userId });
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const carts = await prisma.cartGroup.findMany({
        where: { userId, items: { some: {} } },
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            size: true,
                        }
                    }
                }
            },
            seller: {
                select: {
                    id: true,
                    userName: true,
                    fname: true,
                    _count: {
                        select: {
                            products: true
                        }
                    },
                    picture: {
                        select: {
                            url: true
                        }
                    },
                    bundleDiscount: {
                        include: {
                            tiers: {
                                select: {
                                    itemCount: true,
                                    discountPercent: true
                                }
                            }
                        }
                    }
                }
            },
        }
    });

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(carts));

    return carts;
}

const cartsByUserSeller = async (userId: string, sellerUserName: string) => {

    //check on redis cache first
    const cacheKey = await redisKeys.userCartSpecificSellerKey({ userId, sellerUserName });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const seller = await prisma.user.findFirst({
        where: { userName: sellerUserName },
        select: {
            id: true,
            bundleDiscount: {
                select: {
                    tiers: {
                        select: {
                            itemCount: true,
                            discountPercent: true
                        }
                    }
                }
            }
        }
    });

    if (!seller) {
        throw new AppError(httpStatus.NOT_FOUND, "Seller does not exist");
    }

    const cart = await prisma.cartGroup.findFirst({
        where: { userId, sellerId: seller?.id },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            size: true,
                        }
                    }
                }
            }
        }
    });

    const subTotal = cart?.items.reduce((acc, item) => acc + item.product.finalPrice, 0) || 0;

    const itemCount = cart?.items.length || 0;

    const bundleDiscountTiers = seller?.bundleDiscount?.tiers || [];

    const nearestTier = bundleDiscountTiers
        .filter(tier => itemCount >= (tier.itemCount ?? 0))
        .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

    const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

    const bundleDiscountAmount = subTotal * (bundleDiscountPercent / 100);
    const total = subTotal - bundleDiscountAmount;

    const result = {
        items: cart?.items || [],
        subTotal,
        total,
        bundleDiscountPercent,
        bundleDiscountAmount,
        cartGroupId: cart?.id || null,
        sellerId: seller?.id
    };

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

    return result;
}

interface Icartgroup extends CartGroup {
    items: {
        product: {
            images: {
                url: string;
            }[];
            size: Size,
            finalPrice: number;
            isDeleted: boolean;
            stock: number;
        },
        extraDonation: number;
    }[],
    seller: {
        id: string;
        userName: string;
        picture: {
            url: string;
        } | null;
        bundleDiscount: {
            tiers: {
                itemCount: number;
                discountPercent: number;
            }[]
        };
    }
}

const checkoutItem = async (cartGroupId: string, userId: string) => {

    //check redis cache first
    const cacheKey = await redisKeys.userCheckoutCartItemKey({ userId, cartGroupId });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData) as Icartgroup;
    }

    const cart = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                select: {
                                    url: true
                                }
                            },
                            size: true,
                        }
                    }
                }
            },
            seller: {
                select: {
                    id: true,
                    userName: true,
                    picture: {
                        select: {
                            url: true
                        }
                    },
                    bundleDiscount: {
                        select: {
                            tiers: true
                        }
                    }
                }
            },
        }
    });


    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    //set cache for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(cart));

    return cart;
}

const checkoutSummary = async (cartGroupId: string, userId: string) => {

    const cart = await checkoutItem(cartGroupId, userId);

    const itemCount = cart.items.length;

    const bundleDiscountTiers = cart?.seller?.bundleDiscount?.tiers || [];

    const nearestTier = bundleDiscountTiers
        .filter(tier => itemCount >= (tier.itemCount ?? 0))
        .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

    const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

    const itemTotal = cart.items.reduce((acc, item) => acc + item.product.finalPrice, 0);
    const totalExtraDonation = cart.items.reduce((acc, item) => acc + (item.extraDonation || 0), 0);

    const serviceFee = 2.30; //fixed service fee of $2.30

    const bundleDiscountAmount = itemTotal * (bundleDiscountPercent / 100);
    const discountedItemTotal = itemTotal - bundleDiscountAmount;

    const subTotal = discountedItemTotal + serviceFee + totalExtraDonation;

    const haveAnyUnavailableItems = cart.items.some(item => item.product.isDeleted || item.product.stock <= 0);

    return {
        itemTotal: itemTotal,
        subTotal,
        itemsCount: cart.items.length,
        haveAnyUnavailableItems,
        serviceFeeCost: serviceFee,
        bundleDiscountPercent,
        bundleDiscountAmount: bundleDiscountAmount,
        totalExtraDonation
    };
}

const addToCart = async (payload: { productId: string, quantity: number, extraDonation: number, extraDonationAnonymous: boolean, charities: { charityId: string }[] }, userId: string) => {

    const { productId, quantity, extraDonation, extraDonationAnonymous, charities } = payload;

    //check product exist
    const product = await prisma.product.findFirst({ where: { id: productId } });
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { productId, group: { userId } } });
    if (cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Product already exist in cart");
    }

    //check own product
    if (product?.userId === userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot add your own product to cart");
    }

    const sellerId = product?.userId;

    const cartGroup = await prisma.cartGroup.upsert({
        where: {
            sellerId_userId: {
                sellerId: sellerId,
                userId: userId
            }
        },
        update: {
            items: {
                create: {
                    productId,
                    quantity,
                    extraDonation,
                    extraDonationAnonymous,
                    charities: {
                        createMany: {
                            data: charities?.map(charity => ({
                                charityId: charity?.charityId,
                            }))
                        }
                    }
                }
            }
        },
        create: {
            userId,
            sellerId,
            items: {
                create: {
                    productId,
                    quantity,
                    extraDonation,
                    extraDonationAnonymous,
                    charities: {
                        createMany: {
                            data: charities?.map(charity => ({
                                charityId: charity?.charityId,
                            }))
                        }
                    }
                }
            }
        }
    });

    //ignore cache
    await redisKeys.incrementUserCartVersion({ userId });

    return cartGroup;

}

const deleteCartItem = async (productId: string, userId: string) => {

    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { productId, group: { userId } } });
    if (!cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Cart item does not exist");
    }

    await prisma.cartItem.delete({ where: { id: cartItemExist.id } });

    //ignore cache
    await redisKeys.incrementUserCartVersion({ userId });

    return;
}

const truncate = (value: string | null, max = 32) => {
    return value?.trim().slice(0, max) || "";
};

const normalize = (v?: string | null) => (v ?? "").trim().toLowerCase();

const buildRatesCacheKey = (shipPayload: any) => {
    const keyData = {
        v: 1, // bump when payload structure changes
        origin: {
            l1: normalize(shipPayload.origin_address.line_1),
            l2: normalize(shipPayload.origin_address.line_2),
            city: normalize(shipPayload.origin_address.city),
            state: normalize(shipPayload.origin_address.state),
            zip: normalize(shipPayload.origin_address.postal_code),
            cc: normalize(shipPayload.origin_address.country_alpha2),
        },
        dest: {
            l1: normalize(shipPayload.destination_address.line_1),
            l2: normalize(shipPayload.destination_address.line_2),
            city: normalize(shipPayload.destination_address.city),
            state: normalize(shipPayload.destination_address.state),
            zip: normalize(shipPayload.destination_address.postal_code),
            cc: normalize(shipPayload.destination_address.country_alpha2),
            // contact name/email/phone omitted: they don't affect rates
        },
        incoterms: shipPayload.incoterms,
        currency: shipPayload.shipping_settings.output_currency,
        items: shipPayload.parcels[0].items
            .map((i: any) => ({
                q: i.quantity,
                w: i.actual_weight,
                h: i.dimensions.height,
                wd: i.dimensions.width,
                l: i.dimensions.length,
                p: i.declared_customs_value,
            }))
            // sort so item order in the cart doesn't change the key
            .sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    };

    const hash = crypto.createHash("sha256").update(JSON.stringify(keyData)).digest("hex");
    return `shipping:rates:${hash}`;
};

const availableRates = async (cartGroupId: string, userId: string) => {
    const cartgroup = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            finalPrice: true,
                            weight_kg: true,
                            hight_cm: true,
                            width_cm: true,
                            length_cm: true,
                        }
                    }
                }
            },
            seller: {
                include: {
                    sellerAddress: true,
                }
            }
        }
    });


    if (!cartgroup) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    //check cart owner is the current user
    if (cartgroup.userId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Permission denied, you are not the owner of this cart");
    }

    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        return;
    }

    if (!cartgroup?.seller?.sellerAddress) {
        return;
    }

    if (cartgroup?.items?.length === 0) {
        return;
    }

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(cartgroup?.seller?.sellerAddress?.address1),
            "line_2": truncate(cartgroup?.seller?.sellerAddress?.address2),
            "city": truncate(cartgroup?.seller?.sellerAddress?.city, 20),
            "state": truncate(cartgroup?.seller?.sellerAddress?.state, 20),
            "postal_code": truncate(cartgroup?.seller?.sellerAddress?.zip_code, 10),
            "country_alpha2": cartgroup?.seller?.sellerAddress?.countryCode
        },
        "destination_address": {
            "line_1": truncate(billing_details?.address1),
            "line_2": truncate(billing_details?.address2),
            "city": truncate(billing_details?.city, 20),
            "state": truncate(billing_details?.state, 20),
            "postal_code": truncate(billing_details?.zip_code, 10),
            "country_alpha2": billing_details?.countryCode,
            "contact_name": billing_details?.full_name,
            "contact_email": billing_details?.email,
            "contact_phone": billing_details?.contact
        },
        "incoterms": "DDP",
        "courier_settings": {
            "show_courier_logo_url": true
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
                "items": cartgroup?.items?.map(item => {
                    return {
                        "category": "fashion",
                        "quantity": 1,
                        "actual_weight": item?.product?.weight_kg,
                        "dimensions": {
                            "height": item?.product?.hight_cm,
                            "width": item?.product?.width_cm,
                            "length": item?.product?.length_cm
                        },
                        "declared_currency": "USD",
                        "declared_customs_value": item?.product?.finalPrice || 0
                    }
                }),
            }
        ],
        "calculate_tax_and_duties": true
    }

    const cacheKey = buildRatesCacheKey(shipPayload);

    const cached = await redisPub.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const rateRes = await fetch(`${config.easyship.easyship_base_url}/rates`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => null);
        console.log(errorData);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Failed to fetch shipping rates',
        );
    }

    const rateData = await rateRes.json();

    // Cache the result for future use
    await redisPub.set(cacheKey, JSON.stringify(rateData), {
        EX: 3600, // expire after 1 hour
    });

    return rateData;
}

type Ioffer = Prisma.OfferGetPayload<{
    include: {
        offerItems: {
            include: {
                product: {
                    include: {
                        images: {
                            select: {
                                url: true;
                            };
                        };
                        size: true;
                    };
                };
            };
        };
        seller: {
            select: {
                id: true;
                userName: true;
                picture: {
                    select: {
                        url: true;
                    };
                };
                sellerAddress: true;
                fcmToken: true;
            };
        };
        buyer: {
            select: {
                fcmToken: true;
            }
        }
    };
}>;

const offerCheckoutItem = async (offerId: string, userId: string) => {

    //check on redis cache first
    const cacheKey = await redisKeys.offerItemsKey({ offerId });
    const cachedData = await redisPub.get(cacheKey);

    let offer: Ioffer | null = null;

    if (cachedData) {
        const cachedOffer = JSON.parse(cachedData);

        offer = cachedOffer as Ioffer
    } else {

        offer = await offerService.offerDetils(offerId);
    }

    if (!offer) {
        throw new AppError(httpStatus.NOT_FOUND, "Offer does not exist");
    }

    if( offer.buyerId !== userId) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not the owner of this offer");
    }

    if (offer.status == "PENDING") {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is not accepted yet");
    }

    if (offer.status == "REJECTED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is unavailable for checkout");
    }

    if (offer.status == "CANCELED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is unavailable for checkout");
    }

    if (!offer?.expiredAt || offer?.expiredAt < new Date()) {
        throw new AppError(httpStatus.BAD_REQUEST, "Offer is expired");
    }

    return offer;
}

const offerAvailableRates = async (offerId: string, userId: string) => {

    const offer = await offerCheckoutItem(offerId, userId);

    const billing_details = await prisma.billingDetails.findFirst({ where: { userId } });

    if (!billing_details) {
        return;
    }

    if (!offer?.seller?.sellerAddress) {
        return;
    }

    if (offer?.offerItems?.length === 0) {
        return;
    }

    const shipPayload = {
        "origin_address": {
            "line_1": truncate(offer?.seller?.sellerAddress?.address1),
            "line_2": truncate(offer?.seller?.sellerAddress?.address2),
            "city": truncate(offer?.seller?.sellerAddress?.city, 20),
            "state": truncate(offer?.seller?.sellerAddress?.state, 20),
            "postal_code": truncate(offer?.seller?.sellerAddress?.zip_code, 10),
            "country_alpha2": offer?.seller?.sellerAddress?.countryCode
        },
        "destination_address": {
            "line_1": truncate(billing_details?.address1),
            "line_2": truncate(billing_details?.address2),
            "city": truncate(billing_details?.city, 20),
            "state": truncate(billing_details?.state, 20),
            "postal_code": truncate(billing_details?.zip_code, 10),
            "country_alpha2": billing_details?.countryCode,
            "contact_name": billing_details?.full_name,
            "contact_email": billing_details?.email,
            "contact_phone": billing_details?.contact
        },
        "incoterms": "DDP",
        "courier_settings": {
            "show_courier_logo_url": true
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
                "items": offer?.offerItems?.map(item => {
                    return {
                        "category": "fashion",
                        "quantity": 1,
                        "actual_weight": item?.product?.weight_kg,
                        "dimensions": {
                            "height": item?.product?.hight_cm,
                            "width": item?.product?.width_cm,
                            "length": item?.product?.length_cm
                        },
                        "declared_currency": "USD",
                        "declared_customs_value": item?.product?.finalPrice || 0
                    }
                }),
            }
        ],
        "calculate_tax_and_duties": true
    }

    const cacheKey = buildRatesCacheKey(shipPayload);

    const cached = await redisPub.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const rateRes = await fetch(`${config.easyship.easyship_base_url}/rates`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.easyship.easyship_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipPayload)
    });

    if (!rateRes.ok) {
        const errorData = await rateRes.json().catch(() => null);
        console.log(errorData);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            errorData?.error?.message || 'Failed to fetch shipping rates',
        );
    }

    const rateData = await rateRes.json();

    // Cache the result for future use
    await redisPub.set(cacheKey, JSON.stringify(rateData), {
        EX: 3600, // expire after 1 hour
    });

    return rateData;
}

const offerCheckoutSummary = async (offerId: string, userId: string) => {

    const offer = await offerCheckoutItem(offerId, userId);

    const itemTotal = offer?.offeredPrice;
    const totalExtraDonation = 0;

    const serviceFee = 2.30; //fixed service fee of $2.30

    const bundleDiscountAmount = 0;
    const discountedItemTotal = itemTotal - bundleDiscountAmount;

    const subTotal = discountedItemTotal + serviceFee + totalExtraDonation;

    const haveAnyUnavailableItems = offer?.offerItems?.some(item => item?.product?.isDeleted || item?.product?.stock <= 0);

    return {
        itemTotal: itemTotal,
        itemsCount: offer?.offerItems?.length || 0,
        subTotal,
        haveAnyUnavailableItems,
        serviceFeeCost: serviceFee,
        bundleDiscountPercent: 0,
        bundleDiscountAmount: bundleDiscountAmount,
        totalExtraDonation
    };
}

export const cartService = {
    cartsByUser,
    checkoutItem,
    checkoutSummary,
    addToCart,
    availableRates,
    offerAvailableRates,
    deleteCartItem,
    offerCheckoutItem,
    offerCheckoutSummary,
    cartsByUserSeller
}