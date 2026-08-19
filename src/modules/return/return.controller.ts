import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { uploadManyToS3 } from "../../utils/s3";
import { returnService } from "./return.service";

const returnsAsABuyer = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const result = await returnService.returnsAsABuyer(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Returns retrieved successfully',
        data: result,
    });
});

const returnsAsASeller = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const result = await returnService.returnsAsASeller(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Returns retrieved successfully',
        data: result,
    });
});

export const returnController = {
    returnsAsABuyer,
    returnsAsASeller
}