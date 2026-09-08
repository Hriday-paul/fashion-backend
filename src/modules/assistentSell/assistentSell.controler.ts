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


const dltRequest = catchAsync(async (req: Request, res: Response) => {

    const result = await assistentSellService.dltRequest(req?.params?.id, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Request deleted successfully',
        data: result,
    });
});

export const assistentSellControler = {
    addNewRequest,
    myRequests,
    dltRequest
}