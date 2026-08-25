import prisma from "../../shared/prisma";
import { Prisma } from "../../../generated/prisma/client";

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
export const sizeService = {
    allsizes,
}