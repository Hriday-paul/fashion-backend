import { PrismaClient } from "@prisma/client";


export async function BandgeSeed(prisma: PrismaClient) {

    const badges = await prisma.badge.createMany({
        data: [
            {
                name: "Style Starter",
                description: "List first 2 items",
                type: "STYLE_STARTER",
                role: "GENERAL",
                target: 2,
                icon: `/badges/heart-handshake.svg`
            },
            {
                name: "First Purchase",
                description: "Buy pre-loved piece",
                type: "FIRST_PURCHASE",
                role: "GENERAL",
                target: 1,
                icon: `/badges/shopping-bag.svg`
            },
            {
                name: "Money Donor",
                description: "Donate to charity",
                type: "MONEY_DONOR",
                role: "GENERAL",
                target: 1,
                icon: `/badges/circle-dollar-sign.svg`
            },
            {
                name: "First Sale",
                description: "Complete first sale",
                type: "FIRST_SALE",
                role: "GENERAL",
                target: 1,
                icon: `/badges/badge-check.svg`
            },
            {
                name: "Tree Planter",
                description: "Plant a tree",
                type: "TREE_PLANTER",
                role: "GENERAL",
                target: 1,
                icon: `/badges/sprout.svg`
            },
            {
                name: "Clothing Donor",
                description: "Donate clothes",
                type: "CLOTHING_DONOR",
                role: "GENERAL",
                target: 1,
                icon: `/badges/shirt.svg`
            },
            {
                name: "Frequent Seller",
                description: "Consistent sales",
                type: "FREQUENT_SELLER",
                role: "GENERAL",
                target: 1,
                icon: `/badges/package-open.svg`
            },
            {
                name: "Top Buyer",
                description: "20+ purchases",
                type: "TOP_BUYER",
                role: "GENERAL",
                target: 20,
                icon: `/badges/circle-star.svg`
            },
            {
                name: "Speedy Shipper",
                description: "Ship Within 24 hours",
                type: "SPEEDY_SHIPPER",
                role: "GENERAL",
                target: 1,
                icon: `/badges/rocket.svg`
            },
            {
                name: "Fashion Activist",
                description: "10+ badges earned",
                type: "FASHION_ACTIVIST",
                role: "GENERAL",
                target: 10,
                icon: `/badges/award.svg`
            },
            {
                name: "Trusted Seller",
                description: "Verified seller with consistent positive reviews",
                type: "TRUSTED_SELLER",
                role: "GENERAL",
                target: 100,
                icon: `/badges/shield-check.svg`
            },
            {
                name: "Charity Supporter",
                description: "Raise £100+ for charity",
                type: "CHARITY_SUPPORTER",
                role: "GENERAL",
                target: 100,
                icon: `/badges/heart-handshake.svg`
            },
            {
                name: "Sustainable Materials",
                description: "Use eco-friendly fabrics",
                type: "SUSTAINABLE_MATERIALS",
                role: "ECO_FRIENDLY",
                target: 2,
                icon: `/badges/recycle.svg`
            },
            {
                name: "Fast Shipper",
                description: "5+ orders in 24-48h",
                type: "FAST_SHIPPER",
                role: "ECO_FRIENDLY",
                target: 5,
                icon: `/badges/truck.svg`
            },
            {
                name: "Top Eco Seller",
                description: "100+ eco items sold",
                type: "TOP_ECO_SELLER",
                role: "ECO_FRIENDLY",
                target: 100,
                icon: `/badges/leaf.svg`
            },
            {
                name: "Trusted Seller",
                description: "Verified seller with consistent positive reviews",
                type: "TRUSTED_SELLER",
                role: "ECO_FRIENDLY",
                target: 10,
                icon: `/badges/shield-check.svg`
            },
            {
                name: "Charity Supporter",
                description: "Raise £100+ for charity through eco sales",
                type: "CHARITY_SUPPORTER",
                role: "ECO_FRIENDLY",
                target: 100,
                icon: `/badges/heart-handshake.svg`
            },
            {
                name: "Charity Champion",
                description: "Raise £1,000+ for charity through eco sales",
                type: "CHARITY_CHAMPION",
                role: "ECO_FRIENDLY",
                target: 1000,
                icon: `/badges/heart-plus.svg`
            },
            {
                name: "Donor Hero",
                description: "Raise £10,000+ for charity through eco sales",
                type: "TOP_CHARITY_FUNDRAISER",
                role: "ECO_FRIENDLY",
                target: 10000,
                icon: `/badges/trophy.svg`
            },
            {
                name: "Vintage Collection",
                description: "10+ vintage items",
                type: "VINTAGE_COLLECTION",
                role: "CHARITY_SHOP",
                target: 10,
                icon: `/badges/clock.svg`
            },

        ],
        skipDuplicates: true,
    });

    console.log(badges.count, "badges created");
}