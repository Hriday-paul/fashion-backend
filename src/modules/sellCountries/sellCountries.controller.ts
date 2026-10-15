import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { sellCountriesService } from "./sellCountries.service";

const getAllSellCountries = catchAsync(async (req: Request, res: Response) => {
    const result = await sellCountriesService.getAllSellCountries();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sell countries fetched successfully',
        data: result,
    });
});

const addNewSellCountry = catchAsync(async (req: Request, res: Response) => {
    const result = await sellCountriesService.addNewSellCountry(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sell country added successfully',
        data: result,
    });
});

const deleteSellCountry = catchAsync(async (req: Request, res: Response) => {
    const result = await sellCountriesService.deleteSellCountry(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sell country deleted successfully',
        data: result,
    });
});

export const sellCountriesController = {
    getAllSellCountries,
    addNewSellCountry,
    deleteSellCountry
};

