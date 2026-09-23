import { PrismaClient } from "@prisma/client";


export async function KeywordSeed(prisma: PrismaClient) {

    const keywords = [
        { "name": "Nike joggers" },
        { "name": "Adidas sneakers" },
        { "name": "Zara jeans" },
        { "name": "H&M dresses" },
        { "name": "Levi's jeans" },
        { "name": "Puma t-shirts" },
        { "name": "Uniqlo pyjamas" },
        { "name": "Calvin Klein underwear" },
        { "name": "Tommy Hilfiger sweaters" },
        { "name": "Gap shorts" },
        { "name": "black joggers" },
        { "name": "white sneakers" },
        { "name": "navy jeans" },
        { "name": "pink dresses" },
        { "name": "denim jeans" },
        { "name": "grey t-shirts" },
        { "name": "kids onesies" },
        { "name": "baby bodysuits" },
        { "name": "men's shirts" },
        { "name": "women's leggings" },
        { "name": "XL tracksuit" },
        { "name": "small dress" },
        { "name": "sandals summer" },
        { "name": "winter coats" },
        { "name": "casual sweaters" },
        { "name": "sports bra" },
        { "name": "slippers home" },
        { "name": "overalls kids" },
        { "name": "formal shirts men" },
        { "name": "loungewear set" }
    ]

    const keywordsCreated = await prisma.keyword.createMany({
        data: keywords,
        skipDuplicates: true,
    });

    console.log(keywordsCreated.count, "keywords created");
}