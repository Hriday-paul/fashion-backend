import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { BadgeGenerateQueue } from "../../queues/badge.queue";
import { jobs } from "../../queues/jobs.name";
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

const addReview = async (payload: { orderId: string, rating: number, comment?: string }, curentUserId: string) => {

    const { orderId, rating, comment } = payload;

    const order = await prisma.order.findFirst({
        where: {
            id: payload.orderId,
        }
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order does not exist");
    }

    //check if the current user is the buyer of the order
    if (order.buyerId !== curentUserId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to add review for this order");
    }

    //check if the order is completed
    if (order.status !== "COMPLETED") {
        throw new AppError(httpStatus.BAD_REQUEST, "You can only add review for completed orders");
    }

    //check if the user has already added review for this order
    const existingReview = await prisma.rating.findFirst({
        where: {
            orderId: payload.orderId,
            fromUserId: curentUserId,
        }
    });

    if (existingReview) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already added a review for this order");
    }

    //add the new review
    const newReview = await prisma.rating.create({
        data: {
            orderId: orderId,
            fromUserId: curentUserId,
            toUserId: order?.sellerId,
            comment: comment,
            rating: rating,
        }
    });

    //if the rating is 5, generate badge for the seller
    if (rating === 5) {
        //generate badge for the seller, 5 star rating badge
        BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TRUSTED_SELLER", userId: order?.sellerId, increment: 1 });
    }

    return newReview;
}

export const reviewService = {
    userReviewStats,
    reviewsByUser,
    addReview
}