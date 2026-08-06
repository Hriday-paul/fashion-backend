import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { cartService } from "./cart.service";

const cartsByUser = catchAsync(async (req: Request, res: Response) => {
    const result = await cartService.cartsByUser(req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cart items retrived successfully',
        data: result,
    });
});

const addToCart = catchAsync(async (req: Request, res: Response) => {

    await cartService.addToCart(req.body, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Item added to cart successfully',
    });
});

const checkoutItem = catchAsync(async (req: Request, res: Response) => {
    const cartGroupId = req.params.cartGroupId;
    const result = await cartService.checkoutItem(cartGroupId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Checkout item retrieved successfully',
        data: result
    });
});

const deleteCartItem = catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    await cartService.deleteCartItem(itemId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Item deleted from cart successfully',
    });
});

export const cartControler = {
    cartsByUser,
    addToCart,
    checkoutItem,
    deleteCartItem
}
