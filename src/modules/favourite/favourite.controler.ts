import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { favouriteService } from "./favourite.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const favouritesByUser = catchAsync(async (req: Request, res: Response) => {
    const options = pick(req.query, PaginateOptions);
    const result = await favouriteService.favouritesByUser(req.user?.id, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Favourites retrived successfully',
        data: result,
    });
});

const addFavourite = catchAsync(async (req: Request, res: Response) => {
    const result = await favouriteService.addFavourite(req.body?.productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product added successfully to Favourites',
        data: result,
    });
});

const deleteFavourite = catchAsync(async (req: Request, res: Response) => {
    const result = await favouriteService.deleteFavourite(req.params?.id, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product deleted successfully from Favourites',
        data: result,
    });
});

export const favouriteControler = {
    favouritesByUser,
    addFavourite,
    deleteFavourite
}