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

const addNewSize = catchAsync(async (req: Request, res: Response) => {

  const result = await sizeService.addNewSize(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sizes added successfully',
    data: result,
  });
});

const dltSize = catchAsync(async (req: Request, res: Response) => {

  const result = await sizeService.dltSize(req.params.sizeId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sizes deleted successfully',
    data: result,
  });
});

const assignSizeToCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await sizeService.assingedSizeByCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sizes assigned to category successfully',
    data: result,
  });
});

const rmvSizeFromCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await sizeService.deleteSizeFromCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sizes removed from category successfully',
    data: result,
  });
});


export const sizeController = {
    allsizes,
    addNewSize,
    dltSize,
    assignSizeToCategory,
    rmvSizeFromCategory
}