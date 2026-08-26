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
const cartsByUserSeller = catchAsync(async (req: Request, res: Response) => {
    const result = await cartService.cartsByUserSeller(req.user?.id, req.params.sellerUserName);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Items retrived successfully',
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

const checkoutSummary = catchAsync(async (req: Request, res: Response) => {
    const cartGroupId = req.params.cartGroupId;
    const result = await cartService.checkoutSummary(cartGroupId, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Checkout summary retrieved successfully',
        data: result
    });
});

const availableRates = catchAsync(async (req: Request, res: Response) => {
    const cartGroupId = req.params.cartGroupId;
    const result = await cartService.availableRates(cartGroupId, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Available rates retrieved successfully',
        data: result
    });
});

const addTreeGiftCost = catchAsync(async (req: Request, res: Response) => {

    await cartService.addTreeGiftCost(req.body, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Tree gift cost updated successfully',
    });
});

const addAuthenticationCost = catchAsync(async (req: Request, res: Response) => {
    const cartGroupId = req.body.cartGroupId;
    const allowAuthentication = req.body.allowAuthentication;

    await cartService.addAuthenticationCost({ cartGroupId, allowAuthentication }, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Authentication cost updated successfully',
    });
});

const deleteCartItem = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId;
    await cartService.deleteCartItem(productId, req.user?.id);
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
    checkoutSummary,
    addTreeGiftCost,
    addAuthenticationCost,
    availableRates,
    deleteCartItem,
    cartsByUserSeller
}
