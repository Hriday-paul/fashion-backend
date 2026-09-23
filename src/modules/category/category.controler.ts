import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { categoryService } from "./category.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import pick from "../../shared/pick";
import prisma from "../../shared/prisma";

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
  const query = pick(req.query, ["categoryId"])
  const result = await categoryService.getParentChain(query);
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


const filteredAttributes = catchAsync(async (req: Request, res: Response) => {

  const query = pick(req.query, ["categoryId", "brands", "sizes"])

  const result = await categoryService.filteredAttributes(query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attributes retrieved successfully',
    data: result,
  });
});

export const categoryControler = {
  addNewCategory,
  deleteCategory,
  getCategories,
  getParentChain,
  getChildChain,

  filteredAttributes,
}