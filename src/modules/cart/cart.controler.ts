import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { cartServie } from "./cart.service";

const cartsByUser = catchAsync(async (req: Request, res: Response) => {
    const result = await cartServie.cartsByUser(req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cart items retrived successfully',
        data: result,
    });
});

const addToCart = catchAsync(async (req: Request, res: Response) => {

    await cartServie.addToCart(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Item added to cart successfully',
    });
});

const deleteCartItem = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId;
    await cartServie.deleteCartItem(productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Item deleted from cart successfully',
    });
});

export const cartControler = {
    cartsByUser,
    addToCart,
    deleteCartItem
}
