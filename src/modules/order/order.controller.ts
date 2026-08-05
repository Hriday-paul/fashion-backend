import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { orderService } from "./order.service";
import { paymentsService } from "../payments/payments.service";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const addNewOrder = catchAsync(async (req: Request, res: Response) => {
    // add order
    const result = await orderService.addNewOrder(req.body, req.user?.id);
    // generate payment link
    const paymentLink = await paymentsService.checkout(result?.id, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order created successfully, Pay now',
        data: paymentLink,
    });
});

const ordersBySeller = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const result = await orderService.ordersBySeller(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

//buyer mark order received
const confirmOrderReceived = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.confirmOrderReceived(req.body.orderId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order completed successfully',
    });
});


const cancelOrderItemBySeller = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.cancelOrderItemBySeller(req.body, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancelled successfully',
    });
});


const requestCancelOrderItem = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.requestCancelOrderItem(req.body, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancel request submitted successfully',
    });
});


const approveCancelOrderItemBySeller = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.approveCancelOrderItemBySeller(req.body?.orderItemId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancel approved successfully',
    });
});

const markShippedOrder = catchAsync(async (req: Request, res: Response) => {
    const { sellerGroupId } = req.params;
    const { id: userId } = req.user;

    await orderService.markShippedOrder(sellerGroupId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order marked as shipped successfully',
    });
});

export const orderControler = {
    addNewOrder,
    ordersBySeller,
    confirmOrderReceived,
    cancelOrderItemBySeller,
    requestCancelOrderItem,
    approveCancelOrderItemBySeller,
    markShippedOrder
}
