import { PrismaClient } from "@prisma/client";
import { BadgeRole, BadgeType } from "../../generated/prisma/enums";


export async function BandgeSeed(prisma: PrismaClient) {

    const badges = await prisma.badge.createMany({
        data: [
            {
                name: "Charity Champion",
                description: "Raise 1,000+ for your charity",
                type: BadgeType.CHARITY_CHAMPION,
                role: BadgeRole.CHARITY_SHOP,
                target: 1000,
                icon: `/badges/money.svg`
            },
            {
                name: "Charity Champion",
                description: "Raise 1,000+ for your charity",
                type: BadgeType.CHARITY_CHAMPION,
                role: BadgeRole.CHARITABLE_ORGANIZATION,
                target: 1000,
                icon: `/badges/money.svg`
            },


            {
                name: "Top Charity Fundraiser",
                description: "Raise 10,000+ for your charity",
                type: BadgeType.TOP_CHARITY_FUNDRAISER,
                role: BadgeRole.CHARITY_SHOP,
                target: 10000,
                icon: `/badges/trophy.svg`
            },
            {
                name: "Top Charity Fundraiser",
                description: "Raise 10,000+ for your charity",
                type: BadgeType.TOP_CHARITY_FUNDRAISER,
                role: BadgeRole.CHARITABLE_ORGANIZATION,
                target: 10000,
                icon: `/badges/trophy.svg`
            },

        ],
        skipDuplicates: true,
    });

    console.log(badges.count, "badges created");
}