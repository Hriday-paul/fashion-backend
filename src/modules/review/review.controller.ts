import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status"
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { reviewService } from "./review.service";

const reviewsStats = catchAsync(async (req: Request, res: Response) => {

    const result = await reviewService.userReviewStats(req.params?.userName);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews stats successfully',
        data: result,
    });
});

const reviewsByUser = catchAsync(async (req: Request, res: Response) => {

    const options = pick(req.query, PaginateOptions);

    const result = await reviewService.reviewsByUser(req.params?.userName, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result,
    });
});

export const reviewControler = {
    reviewsStats,
    reviewsByUser
}
