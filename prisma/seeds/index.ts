import prisma from "../../src/shared/prisma";
import { BandgeSeed } from "./badge.seed";
import { CategorySeed } from "./category.seed";
import { KeywordSeed } from "./keyword.seed";
import { UserSeed } from "./user.seed";

async function main() {

    // await BandgeSeed(prisma);

    // await CategorySeed(prisma);

    // await KeywordSeed(prisma);

    // await UserSeed(prisma);

    //dlt all assistentSells
    await prisma.assistentSell.deleteMany({});

    console.log("assistentSells deleted successfully");
    
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });