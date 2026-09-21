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

const addNewKeyword = catchAsync(async (req: Request, res: Response) => {
    const result = await keywordService.addNewKeyword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'New keyword added successfully',
        data: result,
    });
});


const allkeywords = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm"])
    const options = pick(req.query, PaginateOptions);

    const result = await keywordService.allKeywords(query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Keywords retrieved successfully',
        data: result,
    });
});

const dltKeyword = catchAsync(async (req: Request, res: Response) => {
    const result = await keywordService.dltKeyword(req.params.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Keyword deleted successfully',
        data: result,
    });
});

export const keywordControler = {
    searchSuggestions,
    peopleSuggestions,
    addNewKeyword,
    allkeywords,
    dltKeyword
};