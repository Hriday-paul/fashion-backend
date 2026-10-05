import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status"
import { uploadManyToS3 } from "../../utils/s3";
import AppError from "../../error/AppError";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { assistentSellService } from "./assistentSell.service";

const addNewRequest = catchAsync(async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];

    if (files) {

        if (files.length <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'Minimum 1 image is required',
            );
        }

        const FileAry = files?.map(image => {
            return {
                file: image,
                path: `images/assistentSell/bundles`,
            };
        });

        const urls = await uploadManyToS3(FileAry);
        req.body.pictures = urls.map(url => {
            return {
                key: url.key,
                url: url.url,
            };
        });
    }

    const result = await assistentSellService.addNewRequest(req.body, req.user?.id, req.user.role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your request submited successfully',
        data: result,
    });
});

const allRequests = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["status", "priceType", "searchTerm"])
    const options = pick(req.query, PaginateOptions);

    const result = await assistentSellService.allRequests(query, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All Requests retrived successfully',
        data: result,
    });
});


const myRequests = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["status", "searchTerm"])
    const options = pick(req.query, PaginateOptions);

    const result = await assistentSellService.myRequests(req.user?.id, query, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Requests retrived successfully',
        data: result,
    });
});


const requestDetails = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.requestDetails(req.params?.requestId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Request details retrived successfully',
        data: result,
    });
});


const dltRequest = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.dltRequest(req?.params?.id, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Request deleted successfully',
        data: result,
    });
});

const acceptDeclineRequest = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.acceptDeclineRequest(req?.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Request updated successfully',
        data: result,
    });
});

const markAsListed = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.markAsListed(req?.body?.requestId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Request listed successfully',
        data: result,
    });
});

const requestListingStats = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.requestListingStats(req?.params?.requestId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Listing stats retrieved successfully',
        data: result,
    });
});

const listings = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["status", "searchTerm"])
    const options = pick(req.query, PaginateOptions);

    const result = await assistentSellService.listings(req?.params?.requestId, query, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Listing retrieved successfully',
        data: result,
    });
});

const addNewListing = catchAsync(async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];

    if (!files || files.length <= 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Minimum 1 image is required',
        );
    }

    if (files.length <= 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Minimum 1 image is required',
        );
    }

    const FileAry = files?.map(image => {
        return {
            file: image,
            path: `images/products/images`,
        };
    });

    const urls = await uploadManyToS3(FileAry);
    req.body.images = urls.map(url => {
        return {
            key: url.key,
            url: url.url,
        };
    });


    const result = await assistentSellService.addNewListing(req?.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'New item listed successfully',
        data: result,
    });
});

const assitedSellsEarnings = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "startDate", "endDate"])
    const options = pick(req.query, PaginateOptions);

    const result = await assistentSellService.assitedSellsEarnings(query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Assisted sells earnings retrieved successfully',
        data: result,
    });
});

export const assistentSellControler = {
    addNewRequest,
    myRequests,
    requestDetails,
    dltRequest,
    allRequests,
    acceptDeclineRequest,
    markAsListed,
    requestListingStats,
    listings,
    addNewListing,

    assitedSellsEarnings
}