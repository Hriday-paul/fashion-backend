import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { packageService } from "./package.service";
import httpStatus from "http-status"

const addNewpackage = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.createPackage(req.body);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: 'New Package Created Successfully',
    });
});
const UpdatePackage = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.UpdatePackage(req.params.id, req.body);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: 'Package Updated Successfully',
    });
});
const DeletePackage = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.DeletePackage(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: 'Package Deleted Successfully',
    });
});

const allPackages = catchAsync(async (req: Request, res: Response) => {
    const result = await packageService.allPackages();
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: 'All Package Retrived Successfully',
    });
});

export const packageControler = {
    addNewpackage,
    allPackages,
    UpdatePackage,
    DeletePackage
}