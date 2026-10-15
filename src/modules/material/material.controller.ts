import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { materialService } from "./material.service";
import pick from "../../shared/pick";

const allMaterials = catchAsync(async (req: Request, res: Response) => {

  const query = pick(req.query, ["categoryId"])

  const result = await materialService.materials(query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials fetched successfully',
    data: result,
  });
});

const addNewMaterial = catchAsync(async (req: Request, res: Response) => {

  const result = await materialService.addNewMaterial(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials added successfully',
    data: result,
  });
});

const dleMaterial = catchAsync(async (req: Request, res: Response) => {

  const result = await materialService.dleMaterial(req.params.materialId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials deleted successfully',
    data: result,
  });
});

const assignMaterialToCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await materialService.assignMaterialToCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials assigned to category successfully',
    data: result,
  });
});

const rmvMaterialFromCategory = catchAsync(async (req: Request, res: Response) => {

  const result = await materialService.rmvMaterialFromCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Materials removed from category successfully',
    data: result,
  });
});

export const materialController = {
  allMaterials,
  addNewMaterial,
  dleMaterial,
  assignMaterialToCategory,
  rmvMaterialFromCategory
}

