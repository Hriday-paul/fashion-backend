import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { brandService } from "./brand.service";
import pick from "../../shared/pick";

const allBrands = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["categoryId"])

  const result = await brandService.brands(query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands fetched successfully',
    data: result,
  });
});

export const brandController = {
    allBrands
}