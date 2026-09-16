import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { uploadManyToS3 } from "../../utils/s3";
import { keywordService } from "./keyword.service";

const searchSuggestions = catchAsync(async (req: Request, res: Response) => {
    // search suggestions
    const result = await keywordService.searchSuggestions(req.query?.query as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Search suggestions retrieved successfully',
        data: result,
    });
});

const peopleSuggestions = catchAsync(async (req: Request, res: Response) => {
    // search suggestions
    const result = await keywordService.peopleSuggestions(req.query?.query as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Search suggestions retrieved successfully',
        data: result,
    });
});

export const keywordControler = {
    searchSuggestions,
    peopleSuggestions
};