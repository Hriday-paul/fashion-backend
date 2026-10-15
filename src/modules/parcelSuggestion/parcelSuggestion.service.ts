import httpStatus from "http-status";
import AppError from "../../error/AppError";
import prisma from "../../shared/prisma";
import { categoryService } from "../category/category.service";

interface AddParcelSuggestionPayload {
    categoryId: string;
    weight_kg: number;
    height_cm: number;
    width_cm: number;
    length_cm: number;
}

const getSuggestionByCategoryId = async (categoryId: string, exact: boolean = false) => {
    // 1. Direct suggestion for this category
    const directSuggestion = await prisma.parcelSuggestion.findUnique({
        where: { categoryId },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    parentId: true
                }
            }
        }
    });

    if (directSuggestion || exact) {
        return directSuggestion;
    }

    // 2. Fallback to parent hierarchy if no direct suggestion exists
    const parentChain = await categoryService.getParentChain({ categoryId });
    if (parentChain && parentChain.length > 0) {
        for (let i = parentChain.length - 1; i >= 0; i--) {
            const parent = parentChain[i];
            if (parent.id !== categoryId) {
                const parentSuggestion = await prisma.parcelSuggestion.findUnique({
                    where: { categoryId: parent.id },
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                parentId: true
                            }
                        }
                    }
                });
                if (parentSuggestion) {
                    return parentSuggestion;
                }
            }
        }
    }

    return null;
};

const getAllSuggestions = async () => {
    const result = await prisma.parcelSuggestion.findMany({
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    parentId: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return result;
};

const addSuggestionByCategory = async (payload: AddParcelSuggestionPayload) => {
    const category = await prisma.category.findUnique({
        where: { id: payload.categoryId }
    });

    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }

    const existing = await prisma.parcelSuggestion.findUnique({
        where: { categoryId: payload.categoryId }
    });

    if (existing) {
        throw new AppError(httpStatus.BAD_REQUEST, "Parcel suggestion already exists for this category");
    }

    const result = await prisma.parcelSuggestion.create({
        data: {
            categoryId: payload.categoryId,
            weight_kg: Number(payload.weight_kg),
            height_cm: Number(payload.height_cm),
            width_cm: Number(payload.width_cm),
            length_cm: Number(payload.length_cm)
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    parentId: true
                }
            }
        }
    });

    return result;
};

const editSuggestionByCategory = async (categoryId: string, payload: AddParcelSuggestionPayload) => {

    const updateData = {
        weight_kg: payload?.weight_kg,
        height_cm: payload?.height_cm,
        width_cm: payload?.width_cm,
        length_cm: payload?.length_cm
    };

    const result = await prisma.parcelSuggestion.upsert({
        where: { categoryId },
        create: {
            ...updateData,

            categoryId: categoryId
        },
        update: updateData,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    parentId: true
                }
            }
        }
    });

    return result;
};

const deleteSuggestionByCategory = async (categoryId: string) => {
    const existing = await prisma.parcelSuggestion.findUnique({
        where: { categoryId }
    });

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Parcel suggestion not found for this category");
    }

    const result = await prisma.parcelSuggestion.delete({
        where: { categoryId }
    });

    return result;
};

export const parcelSuggestionService = {
    getSuggestionByCategoryId,
    getAllSuggestions,
    addSuggestionByCategory,
    editSuggestionByCategory,
    deleteSuggestionByCategory
};

