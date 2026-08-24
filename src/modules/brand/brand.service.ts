import prisma from "../../shared/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { categoryService } from "../category/category.service";

const brands = async (query: Record<string, unknown>) => {

    const AndConditions: Prisma.BrandWhereInput[] = [];

    const { categoryId } = query;

    if (categoryId) {

        const childCategoryIds = await categoryService.getChildChain(categoryId as string);

        if (childCategoryIds?.length > 0) {
            AndConditions.push({
                brandByCategories: {
                    some: {
                        categoryId: { in: childCategoryIds.map((category) => category.id) }
                    }
                }
            });
        } else {
            AndConditions.push({
                brandByCategories: {
                    some: {
                        categoryId: categoryId
                    }
                }
            });
        }
    }

    const whereConditions: Prisma.BrandWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.brand.findMany({
        where: whereConditions,
        distinct: "id",
    })

    return result;
}

export const brandService = {
    brands
}