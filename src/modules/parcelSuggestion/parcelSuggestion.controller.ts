import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../error/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { parcelSuggestionService } from "./parcelSuggestion.service";

const getSuggestionByCategoryId = catchAsync(async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId || (req.query.categoryId as string);

    if (!categoryId) {
        const result = await parcelSuggestionService.getAllSuggestions();
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Parcel suggestions fetched successfully",
            data: result,
        });
    }

    const exact = req.query.exact === 'true';
    const result = await parcelSuggestionService.getSuggestionByCategoryId(categoryId, exact);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result ? "Parcel suggestion fetched successfully" : "No parcel suggestion found for this category",
        data: result,
    });
});

const addSuggestionByCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!categoryId) {
        throw new AppError(httpStatus.BAD_REQUEST, "categoryId is required");
    }

    const payload = {
        categoryId,
        weight_kg: req.body.weight_kg,
        height_cm: req.body.height_cm,
        width_cm: req.body.width_cm,
        length_cm: req.body.length_cm
    };

    const result = await parcelSuggestionService.addSuggestionByCategory(payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parcel suggestion added successfully",
        data: result,
    });
});

const editSuggestionByCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!categoryId) {
        throw new AppError(httpStatus.BAD_REQUEST, "categoryId is required");
    }

    const result = await parcelSuggestionService.editSuggestionByCategory(categoryId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parcel suggestion updated successfully",
        data: result,
    });
});

const deleteSuggestionByCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId || req.body.categoryId;

    if (!categoryId) {
        throw new AppError(httpStatus.BAD_REQUEST, "categoryId is required");
    }

    const result = await parcelSuggestionService.deleteSuggestionByCategory(categoryId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parcel suggestion deleted successfully",
        data: result,
    });
});

export const parcelSuggestionController = {
    getSuggestionByCategoryId,
    addSuggestionByCategory,
    editSuggestionByCategory,
    deleteSuggestionByCategory
};

