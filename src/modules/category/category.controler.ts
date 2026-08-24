import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { categoryService } from "./category.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

const addNewCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.addNewCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

const getCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategories();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category retrived successfully',
    data: result,
  });
});

const getParentChain = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getParentChain(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category Parents chain retrived successfully',
    data: result,
  });
});

const getChildChain = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.getChildChain(req.params.id);

  const result = await categoryService.buildChildCategoryTree(categories);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category Child chain retrived successfully',
    data: result,
  });
});

const addNewBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.assignBrandToCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'New Brand added successfully to a category',
    data: result,
  });
});

const allBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.allBrandsByCategory(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands retrived successfully',
    data: result,
  });
});

const deletBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deletBrandToCategory(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand deleted successfully',
    data: result,
  });
});

const allSizes = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.assingedSizeByCategory(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sizes retrived successfully',
    data: result,
  });
});

const addSize = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.addSizeToCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Size created successfully',
    data: result,
  });
});

const deleteSize = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteSizeFromCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Size deleted successfully',
    data: result,
  });
});

export const categoryControler = {
  addNewCategory,
  deleteCategory,
  getCategories,
  getParentChain,
  getChildChain,

  addNewBrand,
  allBrands,
  deletBrand,

  allSizes,
  addSize,
  deleteSize
}