import { Prisma } from "../../../generated/prisma/client";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import prisma from "../../shared/prisma";

export type Ioffer = Prisma.OfferGetPayload<{
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

const offerDetils = async (offerId: string): Promise<Ioffer | null> => {

    //check on redis cache first
    const cacheKey = await redisKeys.offerItemsKey({ offerId });
    const cachedData = await redisPub.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData) as Ioffer;
    }

    const fresh_offer = await prisma.offer.findFirst({
        where: { id: offerId },
        include: {
            offerItems: {
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
                    sellerAddress: true,
                    fcmToken: true
                }
            },
            buyer: {
                select: {
                    fcmToken: true
                }
            }
        }
    });

    if (fresh_offer) {
        //set on redis cache
        await redisPub.setEx(cacheKey, 60 * 10, JSON.stringify(fresh_offer)); //10 minutes cache
    }

    return fresh_offer;
}

export const offerService = {
    offerDetils
}