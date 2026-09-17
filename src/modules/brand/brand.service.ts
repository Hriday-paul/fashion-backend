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

const addNewBrand = async (payload: { name: string }) => {
    const res = await prisma.brand.create({ data: { name: payload?.name } });
    return res;
}

const dleBrand = async (brandId: string) => {
    const res = await prisma.brand.delete({ where: { id: brandId } });
    return res;
}

const assignBrandToCategory = async (payload: { categoryId: string, brandId: string }[]) => {

    const res = await prisma.brandByCategory.createMany({ data: payload });
    return res;
}

const rmvBrandFromCategory = async (payload: { categoryId: string, brandId: string }) => {

    const res = await prisma.brandByCategory.delete({
        where: {
            categoryId_brandId: { categoryId: payload?.categoryId, brandId: payload?.brandId }
        }
    });
    return res;
}

export const brandService = {
    brands,
    addNewBrand,
    dleBrand,
    assignBrandToCategory,
    rmvBrandFromCategory
}