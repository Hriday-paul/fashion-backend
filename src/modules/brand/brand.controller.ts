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

const addNewBrand = catchAsync(async (req: Request, res: Response) => {

  const result = await brandService.addNewBrand(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands added successfully',
    data: result,
  });
});

const dleBrand = catchAsync(async (req: Request, res: Response) => {

  const result = await brandService.dleBrand(req.params.brandId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands deleted successfully',
    data: result,
  });
});

const assignBrandToCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await brandService.assignBrandToCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands assigned to category successfully',
    data: result,
  });
});

const rmvBrandFromCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await brandService.rmvBrandFromCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands assigned to category successfully',
    data: result,
  });
});

export const brandController = {
  allBrands,
  addNewBrand,
  dleBrand,
  assignBrandToCategory,
  rmvBrandFromCategory
}