import prisma from "../../shared/prisma";
import { Prisma, Size } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import httpStatus from "http-status";

const allsizes = async (query: Record<string, unknown>) => {

    const AndConditions: Prisma.SizeWhereInput[] = [];

    const { categoryId } = query;

    if (categoryId) {
        AndConditions.push({
            sizeCategoryHierarchyGroups: {
                some: {
                    categoryId: categoryId as string
                }
            }
        })
    }
    else {
        AndConditions.push({
            parentId: null
        }, {
            id: {
                in: ["9b19e7bc-6f46-46c5-bf1d-862fa4c4cc75", "58ab4f77-1ce0-4ff5-8163-181a9b636ba4"]
            }
        })
    }

    const whereConditions: Prisma.SizeWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.size.findMany({
        where: whereConditions,
        include: {
            children: {
                include: {
                    children: {
                        include: {
                            children: {
                                include: {
                                    children: {
                                        include: {
                                            children: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    return result;
}

const addNewSize = async (payload: Size) => {
    const res = await prisma.size.create({ data: payload });
    return res;
}

const dltSize = async (sizeId: string) => {
    const res = await prisma.size.delete({ where: { id: sizeId } });
    return res;
}

const assingedSizeByCategory = async (payload: {sizes : { sizeId: string }[], categoryId: string}) => {

    const result = await prisma.sizeCategoryHierarchyGroup.createMany({
        data: payload.sizes.map((size) => ({
            categoryId: payload.categoryId,
            sizeId: size.sizeId
        }))
    });


    return result;
}

const deleteSizeFromCategory = async (payload: { categoryId: string, sizeId: string }) => {

    const res = await prisma.sizeCategoryHierarchyGroup.delete({ where: { categoryId_sizeId: { categoryId: payload?.categoryId, sizeId: payload?.sizeId } } });
    return res;
}

export const sizeService = {
    addNewSize,
    assingedSizeByCategory,
    allsizes,
    dltSize,
    deleteSizeFromCategory
}