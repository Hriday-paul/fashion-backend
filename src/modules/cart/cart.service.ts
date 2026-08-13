import config from "../../config";
import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";

const cartsByUser = async (userId: string) => {

    const carts = await prisma.cartGroup.findMany({
        where: { userId, items: { some: {} } },
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

    return carts;
}

const checkoutItem = async (cartGroupId: string, userId: string) => {

    const carts = await prisma.cartGroup.findFirst({
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
                }
            },
        }
    });

    if (!carts) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    return carts;
}

const checkoutSummary = async (cartGroupId: string, userId: string) => {

    const cart = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            finalPrice: true,
                        }
                    }
                }
            },
            seller: {
                include: {
                    bundleDiscount: {
                        include: {
                            tiers: true
                        }
                    }
                }
            }
        }
    });

    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    const itemCount = cart.items.length;

    const bundleDiscountTiers = cart?.seller?.bundleDiscount?.tiers || [];

    const nearestTier = bundleDiscountTiers
        .filter(tier => itemCount >= (tier.itemCount ?? 0))
        .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))[0] ?? null;

    const bundleDiscountPercent = nearestTier ? nearestTier.discountPercent : 0;

    const itemTotal = cart.items.reduce((acc, item) => acc + item.product.finalPrice, 0);
    const totalExtraDonation = cart.items.reduce((acc, item) => acc + (item.extraDonation || 0), 0);
    const otherTotal = (cart.serviceFeeCost || 0) + (cart.treeGiftCost || 0) + (cart.authenticationCost || 0);

    const bundleDiscountAmount = itemTotal * (bundleDiscountPercent / 100);
    const discountedItemTotal = itemTotal - bundleDiscountAmount;

    const total = discountedItemTotal + otherTotal + totalExtraDonation;

    return {
        itemTotal: itemTotal,
        otherTotal: otherTotal,
        total: total,
        serviceFeeCost: (cart.serviceFeeCost || 0),
        treeGiftCost: (cart.treeGiftCost || 0),
        authenticationCost: (cart.authenticationCost || 0),
        bundleDiscountPercent,
        bundleDiscountAmount: bundleDiscountAmount,
        totalExtraDonation
    };
}

const addTreeGiftCost = async (payload: { cartGroupId: string, treeGiftCount: number }, userId: string) => {
    const { cartGroupId, treeGiftCount } = payload;
    const cart = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
    });

    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    const updatedCart = await prisma.cartGroup.update({
        where: { id: cartGroupId },
        data: { treeGiftCost: treeGiftCount * 4 } // Assuming each tree gift costs $4
    });

    return updatedCart;
}

const addAuthenticationCost = async (payload: { cartGroupId: string, allowAuthentication: boolean }, userId: string) => {

    const { cartGroupId, allowAuthentication } = payload;

    const cart = await prisma.cartGroup.findFirst({
        where: { id: cartGroupId, userId },
        include: {
            _count: {
                select: {
                    items: true
                }
            }
        }
    });

    if (!cart) {
        throw new AppError(httpStatus.NOT_FOUND, "Cart does not exist");
    }

    const itemsLength = cart?._count?.items || 0;

    const authenticationFee = itemsLength < 3 ? (itemsLength * 15) : 35;

    const updatedCart = await prisma.cartGroup.update({
        where: { id: cartGroupId },
        data: {
            authenticationCost: allowAuthentication ? authenticationFee : 0
        }
    });

    return updatedCart;
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

    const sellerId = product?.userId;

    const cartGroup = await prisma.cartGroup.upsert({
        where: {
            sellerId: sellerId,
            userId: userId
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

    return cartGroup;

}

const deleteCartItem = async (itemId: string, userId: string) => {
    //check item exist in cart
    const cartItemExist = await prisma.cartItem.findFirst({ where: { id: itemId, group: { userId } } });
    if (!cartItemExist) {
        throw new AppError(httpStatus.CONFLICT, "Cart item does not exist");
    }

    await prisma.cartItem.delete({ where: { id: cartItemExist.id } });
    return;
}

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

    const shipPayload = {
        "origin_address": {
            "line_1": "Pariser Platz 1",
            "city": "Berlin",
            "state": "Berlin",
            "postal_code": "10117",
            "country_alpha2": "DE"
        },
        "destination_address": {
            "line_1": billing_details?.address1,
            "city": billing_details?.city,
            "state": billing_details?.state,
            "postal_code": billing_details?.zip_code,
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
                        "actual_weight" : item?.product?.weight_kg,
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

    return rateData;
}

export const cartService = {
    cartsByUser,
    checkoutItem,
    checkoutSummary,
    addToCart,
    availableRates,
    addTreeGiftCost,
    addAuthenticationCost,
    deleteCartItem
}