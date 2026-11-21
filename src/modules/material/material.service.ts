import prisma from "../../shared/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { categoryService } from "../category/category.service";

const materials = async (query: Record<string, unknown>) => {

    const AndConditions: Prisma.MaterialWhereInput[] = [];

    // const { categoryId } = query;

    // if (categoryId) {

    //     const childCategoryIds = await categoryService.getChildChain(categoryId as string);

    //     if (childCategoryIds?.length > 0) {
    //         AndConditions.push({
    //             materialByCategories: {
    //                 some: {
    //                     categoryId: { in: childCategoryIds.map((category) => category.id) }
    //                 }
    //             }
    //         });
    //     } else {
    //         AndConditions.push({
    //             materialByCategories: {
    //                 some: {
    //                     categoryId: categoryId
    //                 }
    //             }
    //         });
    //     }
    // }

    const whereConditions: Prisma.MaterialWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.material.findMany({
        where: whereConditions,
        distinct: "id",
    })

    return result;
}

const addNewMaterial = async (payload: { name: string }) => {
    const res = await prisma.material.create({ data: { name: payload?.name } });
    return res;
}

const dleMaterial = async (materialId: string) => {
    const res = await prisma.material.delete({ where: { id: materialId } });
    return res;
}

const assignMaterialToCategory = async (payload: { categoryId: string, materialId: string }[]) => {

    const res = await prisma.materialByCategory.createMany({ data: payload });
    return res;
}

const rmvMaterialFromCategory = async (payload: { categoryId: string, materialId: string }) => {

    const res = await prisma.materialByCategory.delete({
        where: {
            categoryId_materialId: { categoryId: payload?.categoryId, materialId: payload?.materialId }
        }
    });
    return res;
}

export const materialService = {
    materials,
    addNewMaterial,
    dleMaterial,
    assignMaterialToCategory,
    rmvMaterialFromCategory
}

