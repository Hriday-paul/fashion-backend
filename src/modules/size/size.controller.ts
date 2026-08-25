import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import pick from "../../shared/pick";
import { sizeService } from "./size.service";

const allsizes = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["categoryId"])

    const result = await sizeService.allsizes(query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sizes fetched successfully',
        data: result,
    });
});

export const sizeController = {
    allsizes,
}