import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import httpStatus from "http-status";

const userReviewStats = async (userName: string) => {

    const user = await prisma.user.findFirst({
        where: { userName },
        select: { id: true }
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
    }

    const totalReviews = await prisma.rating.count({
        where: { toUserId: user?.id },
    });

    const averageRating = await prisma.rating.aggregate({
        where: { toUserId: user?.id },
        _avg: {
            rating: true,
        },
    });

    return {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
    };
}

const reviewsByUser = async (userName: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const user = await prisma.user.findFirst({
        where: { userName },
        select: { id: true }
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
    }

    const reviews = await prisma.rating.findMany({
        where: { toUserId: user?.id },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
        }
    });

    const total = await prisma.rating.count({
        where: { toUserId: user?.id },
    });

    return {
        meta: paginationHelper.generatePaginationMeta({
            total,
            page,
            limit,
        }),
        data: reviews,
    };
}

export const reviewService = {
    userReviewStats,
    reviewsByUser
}