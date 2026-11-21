import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { sizeService } from "./size.service";

const respond = (message: string, statusCode: number = httpStatus.OK) =>
    (res: Response, data: unknown) => sendResponse(res, { statusCode, success: true, message, data });

const getSizes = catchAsync(async (req: Request, res: Response) => {
    const categoryId = typeof req.query.categoryId === "string" && req.query.categoryId ? req.query.categoryId : undefined;
    respond("Sizes fetched successfully")(res, await sizeService.getSizes(categoryId));
});

const allSizeGroups = catchAsync(async (_req: Request, res: Response) => {
    respond("Size groups fetched successfully")(res, await sizeService.allSizeGroups());
});

const createSizeGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Size group created successfully")(res, await sizeService.createSizeGroup(req.body));
});

const updateSizeGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Size group updated successfully")(res, await sizeService.updateSizeGroup(req.params.id, req.body));
});

const deleteSizeGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Size group deleted successfully")(res, await sizeService.deleteSizeGroup(req.params.id));
});

const addSizeToGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Size added successfully")(res, await sizeService.addSizeToGroup(req.params.id, req.body));
});

const getLetterSizeGroup = catchAsync(async (_req: Request, res: Response) => {
    respond("Letter size group fetched successfully")(res, await sizeService.getLetterSizeGroup());
});

const createLetterSizeGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Letter size group created successfully")(res, await sizeService.createLetterSizeGroup(req.body));
});

const updateLetterSizeGroup = catchAsync(async (req: Request, res: Response) => {
    respond("Letter size group updated successfully")(res, await sizeService.updateLetterSizeGroup(req.body));
});

const addLetterSize = catchAsync(async (req: Request, res: Response) => {
    respond("Letter size added successfully")(res, await sizeService.addLetterSize(req.body));
});

const updateSize = catchAsync(async (req: Request, res: Response) => {
    respond("Size updated successfully")(res, await sizeService.updateSize(req.params.sizeId, req.body));
});

const dltSize = catchAsync(async (req: Request, res: Response) => {
    respond("Size deleted successfully")(res, await sizeService.dltSize(req.params.sizeId));
});

const getCategoryAssignment = catchAsync(async (req: Request, res: Response) => {
    respond("Category sizes fetched successfully")(res, await sizeService.getCategoryAssignment(req.params.categoryId));
});

const assignToCategory = catchAsync(async (req: Request, res: Response) => {
    respond("Size group assigned successfully")(res, await sizeService.assignToCategory(req.body));
});

const removeFromCategory = catchAsync(async (req: Request, res: Response) => {
    respond("Size group removed successfully")(
        res,
        await sizeService.removeFromCategory(req.params.categoryId, req.query.type as "size" | "letter")
    );
});

export const sizeController = {
    getSizes,
    allSizeGroups,
    createSizeGroup,
    updateSizeGroup,
    deleteSizeGroup,
    addSizeToGroup,
    getLetterSizeGroup,
    createLetterSizeGroup,
    updateLetterSizeGroup,
    addLetterSize,
    updateSize,
    dltSize,
    getCategoryAssignment,
    assignToCategory,
    removeFromCategory,
};
